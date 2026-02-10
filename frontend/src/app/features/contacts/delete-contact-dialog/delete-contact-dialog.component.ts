import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
        [disabled]="submitting()"
      >
        {{ submitting() ? 'Deleting...' : 'Delete' }}
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteContactDialogComponent {
  private dialogRef = inject(MatDialogRef<DeleteContactDialogComponent>);
  private contactService = inject(ContactService);
  contact = inject<Contact>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  submitting = signal(false);

  onConfirm(): void {
    this.submitting.set(true);

    this.contactService.deleteContact(this.contact.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.submitting.set(false),
    });
  }
}
