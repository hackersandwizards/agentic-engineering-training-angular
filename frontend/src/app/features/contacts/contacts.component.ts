import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contact } from '../../core/models/contact.model';
import { ContactService } from '../../core/services/contact.service';
import { createPagination } from '../../core/utils/pagination';
import { openDialogAndReload } from '../../core/utils/dialog';
import { AddContactDialogComponent } from './add-contact-dialog/add-contact-dialog.component';
import { EditContactDialogComponent } from './edit-contact-dialog/edit-contact-dialog.component';
import { DeleteContactDialogComponent } from './delete-contact-dialog/delete-contact-dialog.component';

@Component({
  selector: 'app-contacts',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  template: `
    <div class="header">
      <h1>Contacts</h1>
      <button mat-raised-button color="primary" (click)="openAdd()">Add Contact</button>
    </div>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <table mat-table [dataSource]="contacts()" class="full-width">
      <ng-container matColumnDef="organisation">
        <th mat-header-cell *matHeaderCellDef>Organisation</th>
        <td mat-cell *matCellDef="let c">{{ c.organisation }}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Description</th>
        <td mat-cell *matCellDef="let c">{{ c.description || '-' }}</td>
      </ng-container>
      <ng-container matColumnDef="owner">
        <th mat-header-cell *matHeaderCellDef>Owner</th>
        <td mat-cell *matCellDef="let c">{{ c.owner?.full_name || c.owner?.email || '-' }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let c">
          <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Contact actions">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="openEdit(c)">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button mat-menu-item (click)="openDelete(c)">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </mat-menu>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    @if (!loading() && contacts().length === 0) {
      <div class="empty-state">No contacts yet. Click "Add Contact" to create one.</div>
    }

    <div class="pagination">
      <button mat-button [disabled]="pagination.page() <= 1" (click)="pagination.goToPage(pagination.page() - 1, loadContacts)">Previous</button>
      <span>Page {{ pagination.page() }} of {{ pagination.totalPages() }}</span>
      <button mat-button [disabled]="pagination.page() >= pagination.totalPages()" (click)="pagination.goToPage(pagination.page() + 1, loadContacts)">Next</button>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    .full-width { width: 100%; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
    .empty-state { text-align: center; padding: 48px 16px; color: #718096; font-size: 15px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent implements OnInit {
  private contactService = inject(ContactService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  displayedColumns = ['organisation', 'description', 'owner', 'actions'];
  contacts = signal<Contact[]>([]);
  loading = signal(true);
  pagination = createPagination(5);

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts = (): void => {
    this.loading.set(true);
    this.contactService.getContacts(this.pagination.skip(), this.pagination.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.contacts.set(res.data);
        this.pagination.updateFromResponse(res.count);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load contacts', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  };

  openAdd(): void {
    openDialogAndReload(this.dialog, this.snackBar, this.destroyRef, AddContactDialogComponent, { width: '500px' }, 'Contact created', this.loadContacts);
  }

  openEdit(contact: Contact): void {
    openDialogAndReload(this.dialog, this.snackBar, this.destroyRef, EditContactDialogComponent, { width: '500px', data: contact }, 'Contact updated', this.loadContacts);
  }

  openDelete(contact: Contact): void {
    openDialogAndReload(this.dialog, this.snackBar, this.destroyRef, DeleteContactDialogComponent, { width: '400px', data: contact }, 'Contact deleted', this.loadContacts);
  }
}
