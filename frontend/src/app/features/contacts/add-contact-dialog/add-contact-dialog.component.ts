import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-add-contact-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Contact</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="addContactForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Organisation</mat-label>
          <input matInput formControlName="organisation" />
          @if (form.controls.organisation.hasError('required') && form.controls.organisation.touched) {
            <mat-error>Organisation is required</mat-error>
          }
          @if (form.controls.organisation.hasError('maxlength')) {
            <mat-error>Maximum 255 characters</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        type="submit"
        form="addContactForm"
        [disabled]="submitting"
      >
        {{ submitting ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class AddContactDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddContactDialogComponent>);
  private contactService = inject(ContactService);

  form = this.fb.nonNullable.group({
    organisation: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  submitting = false;

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { organisation, description } = this.form.getRawValue();

    this.contactService
      .createContact({ organisation, description: description || undefined })
      .subscribe({
        next: (contact) => this.dialogRef.close(contact),
        error: () => (this.submitting = false),
      });
  }
}
