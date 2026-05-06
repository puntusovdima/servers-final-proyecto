import mongoose from 'mongoose';

const deliveryNoteSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  format: {
    type: String,
    enum: ['material', 'hours'],
    required: true
  },
  material: {
    type: String,
    required: function() { return this.format === 'material'; }
  },
  hours: {
    type: Number,
    required: function() { return this.format === 'hours'; }
  },
  description: {
    type: String,
    required: true
  },
  workDate: {
    type: Date,
    required: true
  },
  signed: {
    type: Boolean,
    default: false
  },
  signatureUrl: String,
  pdfUrl: String,
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;
