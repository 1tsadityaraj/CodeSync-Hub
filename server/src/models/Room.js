import mongoose from 'mongoose';
import crypto from 'crypto';

export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'cpp',
  'java',
  'go',
  'rust',
];

/**
 * Generate an unpredictable, human-readable room ID.
 * Format: cs-<4-hex>-<4-hex> (e.g. cs-a8f2-3c9d)
 */
export function generateSecureRoomId() {
  const bytes = crypto.randomBytes(4).toString('hex');
  return `cs-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
}

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['creator', 'participant'],
      default: 'participant',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      default: generateSecureRoomId,
    },
    title: {
      type: String,
      required: [true, 'Please provide a room title'],
      trim: true,
      minlength: [2, 'Room title must be at least 2 characters long'],
      maxlength: [120, 'Room title cannot exceed 120 characters'],
      default: 'Collaborative Interview Session',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: {
        values: SUPPORTED_LANGUAGES,
        message: '{VALUE} is not a supported programming language',
      },
      default: 'javascript',
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      index: true,
    },
    participants: [participantSchema],
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Ensure compound index on participants.user for fast querying of user rooms
 */
roomSchema.index({ 'participants.user': 1, updatedAt: -1 });

/**
 * Check if a user is the creator of the room
 */
roomSchema.methods.isCreator = function (userId) {
  if (!userId) return false;
  const creatorId = this.creator?._id || this.creator;
  return creatorId.toString() === userId.toString();
};

/**
 * Check if a user is already recorded in the room participants
 */
roomSchema.methods.hasParticipant = function (userId) {
  if (!userId) return false;
  const targetId = userId.toString();
  return this.participants.some((p) => {
    const pUserId = p.user?._id || p.user;
    return pUserId.toString() === targetId;
  });
};

/**
 * Return safe room object without sensitive internal mongoose metadata
 */
roomSchema.methods.toSafeObject = function (requestingUserId = null) {
  const isOwner = requestingUserId ? this.isCreator(requestingUserId) : false;

  return {
    id: this._id.toString(),
    roomId: this.roomId,
    title: this.title,
    language: this.language,
    status: this.status,
    isOwner,
    creator: this.creator && typeof this.creator === 'object' && this.creator._id
      ? {
          id: this.creator._id.toString(),
          name: this.creator.name,
          email: this.creator.email,
        }
      : { id: this.creator?.toString() },
    participants: this.participants.map((p) => {
      const u = p.user && typeof p.user === 'object' && p.user._id ? p.user : null;
      return {
        id: (u?._id || p.user).toString(),
        name: u?.name || 'Participant',
        email: u?.email || '',
        role: p.role,
        joinedAt: p.joinedAt,
      };
    }),
    participantCount: this.participants.length,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    endedAt: this.endedAt,
  };
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
