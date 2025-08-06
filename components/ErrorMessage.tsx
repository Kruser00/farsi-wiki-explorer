import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="w-full max-w-md p-4 mx-auto text-center text-red-300 bg-red-500/20 border border-red-500/50 rounded-lg">
    <p className="font-bold">خطا</p>
    <p>{message}</p>
  </div>
);

export default ErrorMessage;