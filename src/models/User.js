import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    name: String,
    lastName: String,
    nif: String,
    
    role: {
        type: String,
        enum: ['admin', 'guest'],
        default: 'admin',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending',
        index: true
    },
    
    verificationCode: String,
    verificationAttempts: {
        type: Number,
        default: 3
    },

    refreshToken: {
        type: String,
        select: false
    },

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

    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
});

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

    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
