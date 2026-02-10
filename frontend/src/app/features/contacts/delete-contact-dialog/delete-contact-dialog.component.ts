import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Contact } from '../../../core/models/contact.model';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-delete-contact-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete Contact</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete <strong>{{ contact.organisation }}</strong>?</p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="warn"
        (click)="onConfirm()"
        [disabled]="submitting"
      >
        {{ submitting ? 'Deleting...' : 'Delete' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DeleteContactDialogComponent {
  private dialogRef = inject(MatDialogRef<DeleteContactDialogComponent>);
  private contactService = inject(ContactService);
  contact = inject<Contact>(MAT_DIALOG_DATA);

  submitting = false;

  onConfirm(): void {
    this.submitting = true;

    this.contactService.deleteContact(this.contact.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => (this.submitting = false),
    });
  }
}
