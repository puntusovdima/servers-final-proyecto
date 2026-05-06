import mongoose from 'mongoose';

/**
 * Company Schema definition.
 * It tracks the organization that groups users together.
 */
const companySchema = new mongoose.Schema({
    // ObjectId linking back to the User document who created this company
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    cif: {
        type: String,
        required: true,
        unique: true
    },
    // Inline address sub-document for simplicity
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    // URL to the logo (to be implemented via Multer later)
    logo: String,
    
    // Freelance indicator. If true, CIF is their NIF and it's a 1-person company
    isFreelance: {
        type: Boolean,
        default: false
    },
    // Used for "Soft Delete". If true, we pretend it doesn't exist in queries.
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    // Automatically manage `createdAt` and `updatedAt` properties
    timestamps: true 
});

const Company = mongoose.model('Company', companySchema);
export default Company;
