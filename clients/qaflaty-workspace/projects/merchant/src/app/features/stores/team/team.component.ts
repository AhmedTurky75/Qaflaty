import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface TeamMember {
  merchantId: string;
  fullName: string;
  email: string;
  phone: string | null;
  username: string;
  isVerified: boolean;
  role: string;
  isActive: boolean;
  invitedBy: string | null;
  joinedAt: string;
  createdAt: string;
}

const ASSIGNABLE_ROLES = ['Admin', 'Manager', 'Staff'];

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
})
export class TeamComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storeContext = inject(StoreContextService);

  members = signal<TeamMember[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showInviteModal = signal(false);
  showResetModal = signal(false);
  selectedMember = signal<TeamMember | null>(null);

  inviteLoading = signal(false);
  inviteError = signal<string | null>(null);
  resetLoading = signal(false);
  resetError = signal<string | null>(null);

  roles = ASSIGNABLE_ROLES;

  isOwner = computed(() => {
    const merchant = this.authService.currentMerchant();
    const currentStore = this.storeContext.currentStore();
    return !!merchant && !!currentStore && currentStore.merchantId === merchant.id;
  });

  roleLegend = [
    { role: 'Owner', cls: 'bg-primary-tint text-primary', desc: 'Full access, manages team' },
    { role: 'Admin', cls: 'bg-primary-tint text-primary', desc: 'Full store access' },
    { role: 'Manager', cls: 'bg-success/10 text-success', desc: 'Orders, products, customers' },
    { role: 'Staff', cls: 'bg-surface-elevated text-text-muted', desc: 'Limited access' },
  ];

  inviteForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    role: ['Staff', Validators.required]
  });

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  private get storeId() { return this.storeContext.currentStoreId(); }
  private get apiBase() { return `${environment.apiUrl}/stores/${this.storeId}/team`; }

  ngOnInit(): void { this.loadMembers(); }

  loadMembers(): void {
    if (!this.storeId) { this.loading.set(false); return; }
    this.loading.set(true);
    this.error.set(null);
    this.http.get<TeamMember[]>(this.apiBase, { withCredentials: true }).subscribe({
      next: (m) => { this.members.set(m); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load team members');
        this.loading.set(false);
      }
    });
  }

  openInvite(): void {
    this.inviteForm.reset({ role: 'Staff' });
    this.inviteError.set(null);
    this.showInviteModal.set(true);
  }

  closeInvite(): void { this.showInviteModal.set(false); }

  inviteMember(): void {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }
    this.inviteLoading.set(true);
    this.inviteError.set(null);

    const body = {
      firstName: this.inviteForm.value.firstName,
      lastName: this.inviteForm.value.lastName,
      email: this.inviteForm.value.email,
      username: this.inviteForm.value.username,
      password: this.inviteForm.value.password,
      phone: this.inviteForm.value.phone || null,
      role: this.inviteForm.value.role
    };

    this.http.post(this.apiBase + '/invite', body, { withCredentials: true }).subscribe({
      next: () => {
        this.showInviteModal.set(false);
        this.inviteForm.reset({ role: 'Staff' });
        this.inviteLoading.set(false);
        this.loadMembers();
      },
      error: (err) => {
        this.inviteError.set(err.error?.message || err.error?.title || 'Failed to invite member');
        this.inviteLoading.set(false);
      }
    });
  }

  updateRole(member: TeamMember, newRole: string): void {
    if (member.role === newRole) return;
    this.http.patch(`${this.apiBase}/${member.merchantId}/role`, { newRole }, { withCredentials: true }).subscribe({
      next: () => this.loadMembers(),
      error: (err) => console.error('Failed to update role', err)
    });
  }

  openResetPassword(member: TeamMember): void {
    this.selectedMember.set(member);
    this.resetForm.reset();
    this.resetError.set(null);
    this.showResetModal.set(true);
  }

  closeReset(): void {
    this.showResetModal.set(false);
    this.selectedMember.set(null);
  }

  submitResetPassword(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    const member = this.selectedMember();
    if (!member) return;
    this.resetLoading.set(true);
    this.resetError.set(null);
    this.http.post(`${this.apiBase}/${member.merchantId}/reset-password`, this.resetForm.value, { withCredentials: true }).subscribe({
      next: () => {
        this.showResetModal.set(false);
        this.selectedMember.set(null);
        this.resetLoading.set(false);
      },
      error: (err) => {
        this.resetError.set(err.error?.message || 'Failed to reset password');
        this.resetLoading.set(false);
      }
    });
  }

  removeMember(member: TeamMember): void {
    if (!confirm(`Remove ${member.fullName} from this store? This cannot be undone.`)) return;
    this.http.delete(`${this.apiBase}/${member.merchantId}`, { withCredentials: true }).subscribe({
      next: () => this.loadMembers(),
      error: (err) => console.error('Failed to remove member', err)
    });
  }

  isInvalid(field: string): boolean {
    const c = this.inviteForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Owner':
      case 'Admin':   return 'bg-primary-tint text-primary';
      case 'Manager': return 'bg-success/10 text-success';
      case 'Staff':   return 'bg-surface-elevated text-text-muted';
      default:        return 'bg-surface-elevated text-text-muted';
    }
  }

  getInitials(fullName: string): string {
    return fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
