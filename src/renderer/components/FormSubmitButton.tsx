import React from 'react';
import { Button } from '@mui/material';

interface FormSubmitButtonProps {
  text: string;
}

const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({ text }) => {
  return (
    <Button
      type="submit"
      fullWidth
      variant="contained"
      size="large"
    >
      {text}
    </Button>
  );
};

export default FormSubmitButton; 