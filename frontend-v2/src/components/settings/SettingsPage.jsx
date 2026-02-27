import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { userService } from '@/services/userService';
import { ROLE_LABELS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Lock, User, Building2, Shield, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const isPartner = usePermission('settings:firm');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPwLoading(true);
    try {
      await userService.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMessage({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPwMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Profile Info */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-muted-foreground text-xs">Username</Label>
              <p className="text-sm text-white mt-1">{user?.username}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Role</Label>
              <div className="mt-1">
                <Badge className="bg-primary/10 text-primary border-0">
                  {ROLE_LABELS[user?.role] || user?.role}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Member Since</Label>
              <p className="text-sm text-white mt-1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock size={16} />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                  className="bg-secondary border-0 pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                  className="bg-secondary border-0 pr-10"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
                className={`bg-secondary border-0 ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'ring-1 ring-red-500' : ''}`}
                minLength={6}
              />
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-[11px] text-red-500">Passwords do not match</p>
              )}
            </div>
            {pwMessage && (
              <p className={`text-sm ${pwMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {pwMessage.text}
              </p>
            )}
            <Button type="submit" disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Firm Info — Partner only */}
      {isPartner && (
        <Card className="border-0 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={16} />
              Firm Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground text-xs">Firm Name</Label>
                <p className="text-sm text-white mt-1">Jain Lukkad & Associates</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Type</Label>
                <p className="text-sm text-white mt-1">Chartered Accountants</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">FRN (Firm Registration Number)</Label>
                <p className="text-sm text-muted-foreground mt-1">—</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">UDIN Portal</Label>
                <p className="text-sm text-muted-foreground mt-1">—</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Overview */}
      {isPartner && (
        <Card className="border-0 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield size={16} />
              Role Permissions Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Permission</th>
                    <th className="text-center py-2 px-3 font-medium">Partner</th>
                    <th className="text-center py-2 px-3 font-medium">Sr. CA</th>
                    <th className="text-center py-2 px-3 font-medium">Article</th>
                    <th className="text-center py-2 px-3 font-medium">Client</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {[
                    { label: 'View All Clients', roles: ['partner', 'seniorCA'] },
                    { label: 'Create/Edit Clients', roles: ['partner', 'seniorCA'] },
                    { label: 'Delete Clients', roles: ['partner'] },
                    { label: 'Upload Documents', roles: ['partner', 'seniorCA', 'article', 'client'] },
                    { label: 'Verify Documents', roles: ['partner', 'seniorCA'] },
                    { label: 'Create Tasks', roles: ['partner', 'seniorCA', 'article'] },
                    { label: 'Delete Tasks', roles: ['partner', 'seniorCA'] },
                    { label: 'View All Billing', roles: ['partner', 'seniorCA'] },
                    { label: 'Create Invoices', roles: ['partner', 'seniorCA'] },
                    { label: 'Manage Team', roles: ['partner'] },
                    { label: 'View Activity Log', roles: ['partner', 'seniorCA'] },
                    { label: 'Full Dashboard', roles: ['partner', 'seniorCA'] },
                  ].map((perm) => (
                    <tr key={perm.label} className="border-t border-muted/30">
                      <td className="py-2 pr-4">{perm.label}</td>
                      {['partner', 'seniorCA', 'article', 'client'].map((role) => (
                        <td key={role} className="text-center py-2 px-3">
                          {perm.roles.includes(role) ? (
                            <span className="text-green-500">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
