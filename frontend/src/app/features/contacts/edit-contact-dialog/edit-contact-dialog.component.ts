import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Contact } from '../../../core/models/contact.model';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-edit-contact-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Contact</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="editContactForm" (ngSubmit)="onSubmit()">
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
        form="editContactForm"
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
export class EditContactDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditContactDialogComponent>);
  private contactService = inject(ContactService);
  private contact = inject<Contact>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    organisation: [this.contact.organisation, [Validators.required, Validators.maxLength(255)]],
    description: [this.contact.description ?? ''],
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
      .updateContact(this.contact.id, {
        organisation,
        description: description || undefined,
      })
      .subscribe({
        next: (contact) => this.dialogRef.close(contact),
        error: () => (this.submitting = false),
      });
  }
}
