const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { formValidator } = require('../utils/validators');

// Public Routes
router.get('/', optionalAuth, formController.getAllForms);
router.get('/:formId', optionalAuth, formController.getFormById);

// Protected Admin Routes
router.post('/', 
  authenticate, 
  roleCheck('admin'), 
  validate(formValidator), 
  formController.createForm
);

router.put('/:formId', 
  authenticate, 
  roleCheck('admin'), 
  validate(formValidator), 
  formController.updateForm
);

router.patch('/:formId/toggle-status', 
  authenticate, 
  roleCheck('admin'), 
  formController.toggleFormStatus
);

router.delete('/:formId', 
  authenticate, 
  roleCheck('admin'), 
  formController.deleteForm
);

// Debug Routes (Remove in Production)
router.get('/debug/fields/:formId', authenticate, roleCheck('admin'), async (req, res) => {
  try {
    const connectDB = require('../config/db');
    const Form = require('../models/Form.model');
    const FormField = require('../models/FormField.model');
    
    await connectDB();
    
    const form = await Form.findById(req.params.formId);
    const fields = await FormField.find({ formId: req.params.formId });
    
    res.json({
      success: true,
      data: {
        form: {
          id: form?._id,
          title: form?.title,
          isActive: form?.isActive
        },
        fields: fields.map(f => ({
          id: f._id,
          label: f.label,
          name: f.name,
          fieldType: f.fieldType,
          isActive: f.isActive
        })),
        fieldsCount: fields.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;