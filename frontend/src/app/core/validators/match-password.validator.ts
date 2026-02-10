import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchPasswordValidator(
  passwordField: string,
  confirmField: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField)?.value;
    const confirm = group.get(confirmField)?.value;
    const confirmControl = group.get(confirmField);
    if (!confirmControl) return null;

    if (password && confirm && password !== confirm) {
      confirmControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmControl.hasError('passwordMismatch')) {
      confirmControl.setErrors(null);
    }
    return null;
  };
}
