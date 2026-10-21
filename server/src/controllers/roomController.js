import Room, { SUPPORTED_LANGUAGES, generateSecureRoomId } from '../models/Room.js';

/**
 * @route   POST /api/rooms
 * @desc    Create a new interview room
 * @access  Private (Authenticated)
 */
export async function createRoom(req, res, next) {
  try {
    const { title, language } = req.body;

    const trimmedTitle = title && typeof title === 'string' && title.trim()
      ? title.trim()
      : 'Collaborative Interview Session';

    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Room title must be between 2 and 120 characters',
      });
    }

    const selectedLanguage = language ? language.toLowerCase().trim() : 'javascript';
    if (!SUPPORTED_LANGUAGES.includes(selectedLanguage)) {
      return res.status(400).json({
        success: false,
        message: `Language '${selectedLanguage}' is not supported. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    // Generate unique room ID with collision avoidance retry
    let roomId = generateSecureRoomId();
    let collision = await Room.findOne({ roomId });
    let attempts = 0;
    while (collision && attempts < 5) {
      roomId = generateSecureRoomId();
      collision = await Room.findOne({ roomId });
      attempts++;
    }

    const room = await Room.create({
      roomId,
      title: trimmedTitle,
      creator: req.user._id,
      language: selectedLanguage,
      status: 'active',
      participants: [
        {
          user: req.user._id,
          role: 'creator',
          joinedAt: new Date(),
        },
      ],
    });

    await room.populate([
      { path: 'creator', select: 'name email' },
      { path: 'participants.user', select: 'name email' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Interview room created successfully',
      room: room.toSafeObject(req.user._id),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/rooms
 * @desc    Get rooms created or joined by the authenticated user
 * @access  Private (Authenticated)
 */
export async function getRooms(req, res, next) {
  try {
    const { status, limit = 20 } = req.query;

    const query = {
      'participants.user': req.user._id,
    };

    if (status && ['active', 'ended'].includes(status)) {
      query.status = status;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const rooms = await Room.find(query)
      .sort({ updatedAt: -1 })
      .limit(parsedLimit)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms: rooms.map((r) => r.toSafeObject(req.user._id)),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/rooms/:roomId
 * @desc    Get details of a specific room by its unique roomId
 * @access  Private (Authenticated)
 */
export async function getRoomById(req, res, next) {
  try {
    const { roomId } = req.params;

    if (!roomId || !roomId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    const room = await Room.findOne({ roomId: roomId.trim() })
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room '${roomId}' not found. Please verify the ID or check your invite link.`,
      });
    }

    return res.status(200).json({
      success: true,
      room: room.toSafeObject(req.user._id),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/rooms/:roomId/join
 * @desc    Join an active interview room as an authenticated participant
 * @access  Private (Authenticated)
 */
export async function joinRoom(req, res, next) {
  try {
    const { roomId } = req.params;

    if (!roomId || !roomId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    const room = await Room.findOne({ roomId: roomId.trim() })
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room '${roomId}' not found. Please verify the ID or check your invite link.`,
      });
    }

    // Check if room has ended
    if (room.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This interview room has ended and is no longer accepting new participants.',
        room: room.toSafeObject(req.user._id),
      });
    }

    // Check if already in participants list (idempotent, avoid duplicate memberships)
    if (!room.hasParticipant(req.user._id)) {
      room.participants.push({
        user: req.user._id,
        role: room.isCreator(req.user._id) ? 'creator' : 'participant',
        joinedAt: new Date(),
      });
      await room.save();
      await room.populate('participants.user', 'name email');
    }

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      room: room.toSafeObject(req.user._id),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/rooms/:roomId/end
 * @desc    End an active interview room (Creator only)
 * @access  Private (Authenticated, Creator only)
 */
export async function endRoom(req, res, next) {
  try {
    const { roomId } = req.params;

    if (!roomId || !roomId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    const room = await Room.findOne({ roomId: roomId.trim() })
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room '${roomId}' not found`,
      });
    }

    // Verify requesting user is the room creator
    if (!room.isCreator(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the creator of this room can end it.',
      });
    }

    if (room.status !== 'ended') {
      room.status = 'ended';
      room.endedAt = new Date();
      await room.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Interview room ended successfully',
      room: room.toSafeObject(req.user._id),
    });
  } catch (error) {
    next(error);
  }
}
