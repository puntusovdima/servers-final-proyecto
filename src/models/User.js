import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
/**
 * User Schema definition.
 * Represents all application users (admins and guests).
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true // Automatically creates a unique index in MongoDB
    },
    password: {
        type: String,
        required: true,
        select: false // Prevents the password from being returned in standard queries
    },
    name: String,
    lastName: String,
    nif: String,
    
    role: {
        type: String,
        enum: ['admin', 'guest'], // Restricts value to these options
        default: 'admin',
        index: true // Standard index to speed up role-based queries
    },
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending',
        index: true // Speeds up queries like "find all verified users"
    },
    
    verificationCode: String,
    verificationAttempts: {
        type: Number,
        default: 3
    },
    
    // Stores the current refresh token for session invalidation (Point 7)
    refreshToken: {
        type: String,
        select: false // Not needed in typical client responses
    },

    // Reference to the company this user belongs to
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        index: true
    },
    
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    // Ensures virtual fields are included when converting the document to JSON or regular Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
});

/**
 * Virtual Property: fullName
 * This data is not physically saved in MongoDB. It's computed on-the-fly
 * whenever we fetch a User document.
 */
userSchema.virtual('fullName').get(function() {
    if (this.name && this.lastName) {
        return `${this.name} ${this.lastName}`;
    } else if (this.name) {
        return this.name;
    } else if (this.lastName) {
        return this.lastName;
    }
    return ''; 
});

userSchema.pre('save', async function() {
    // Check if the password has been modified, if not, skip hashing
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
