import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    marketingEmails: false,
    weeklyUpdates: true
  });

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (setting: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleSaveProfile = async () => {
    // Validation
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const dataToUpdate: any = {
        firstName: profileData.firstName,
        lastName: profileData.lastName
      };
      
      // Only include password fields if the user is trying to change password
      if (profileData.currentPassword && profileData.newPassword) {
        dataToUpdate.currentPassword = profileData.currentPassword;
        dataToUpdate.newPassword = profileData.newPassword;
      }
      
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, dataToUpdate);
      
      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully"
        });
        
        // Reset password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsSaving(true);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated"
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    
    if (confirmed) {
      try {
        setIsSaving(true);
        
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Account deleted",
          description: "Your account has been deleted successfully"
        });
        
        // Logout the user
        logout();
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Failed to delete account",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileInputChange}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileInputChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileInputChange}
                  placeholder="Enter your email"
                  type="email"
                  disabled
                />
                <p className="text-xs text-gray-500">You cannot change your email address</p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      value={profileData.currentPassword}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your current password"
                      type="password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        value={profileData.newPassword}
                        onChange={handleProfileInputChange}
                        placeholder="Enter new password"
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        value={profileData.confirmPassword}
                        onChange={handleProfileInputChange}
                        placeholder="Confirm new password"
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                <p className="mt-1 text-sm text-red-700">
                  Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
                </p>
                <div className="mt-4">
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSaving}>
                    {isSaving ? "Processing..." : "Delete Account"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications} 
                    onCheckedChange={() => handleNotificationChange('emailNotifications')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Job Alerts</h3>
                    <p className="text-sm text-gray-500">Get notified about new job matches based on your profile</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.jobAlerts} 
                    onCheckedChange={() => handleNotificationChange('jobAlerts')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                    <p className="text-sm text-gray-500">Receive promotional offers and newsletters</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.marketingEmails} 
                    onCheckedChange={() => handleNotificationChange('marketingEmails')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Weekly Updates</h3>
                    <p className="text-sm text-gray-500">Receive a summary of your job search progress</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.weeklyUpdates} 
                    onCheckedChange={() => handleNotificationChange('weeklyUpdates')} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Current Plan</h3>
                    <p className="text-xl font-bold text-primary-600 mt-1">{user?.plan.charAt(0).toUpperCase() + user?.plan.slice(1) || "Free"}</p>
                  </div>
                  {user?.plan === "free" ? (
                    <Button>Upgrade</Button>
                  ) : (
                    <Button variant="outline">Manage</Button>
                  )}
                </div>
              </div>
              
              <h3 className="text-md font-medium text-gray-900 mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-gray-200">
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-bold text-gray-900">Free</h4>
                    <p className="text-3xl font-bold mt-2">$0<span className="text-sm font-normal text-gray-500">/month</span></p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Basic resume builder
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Up to 2 resumes
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Limited job matching
                      </li>
                      <li className="flex items-center text-sm text-gray-400">
                        <i className="ri-close-line text-red-500 mr-2"></i>
                        No ATS optimization
                      </li>
                      <li className="flex items-center text-sm text-gray-400">
                        <i className="ri-close-line text-red-500 mr-2"></i>
                        No AI mock interviews
                      </li>
                    </ul>
                    {user?.plan === "free" ? (
                      <Button disabled className="w-full mt-6">Current Plan</Button>
                    ) : (
                      <Button variant="outline" className="w-full mt-6">Downgrade</Button>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-primary-400 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Popular
                  </div>
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-bold text-gray-900">Premium</h4>
                    <p className="text-3xl font-bold mt-2">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Advanced resume builder
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Unlimited resumes
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        ATS optimization
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Cover letter generator
                      </li>
                      <li className="flex items-center text-sm text-gray-400">
                        <i className="ri-close-line text-red-500 mr-2"></i>
                        Limited mock interviews
                      </li>
                    </ul>
                    {user?.plan === "premium" ? (
                      <Button disabled className="w-full mt-6">Current Plan</Button>
                    ) : (
                      <Button className="w-full mt-6">Upgrade</Button>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-gray-200">
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-bold text-gray-900">Professional</h4>
                    <p className="text-3xl font-bold mt-2">$19.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        All Premium features
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Unlimited AI mock interviews
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Priority job matching
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        Career coaching session
                      </li>
                      <li className="flex items-center text-sm">
                        <i className="ri-check-line text-green-500 mr-2"></i>
                        LinkedIn profile review
                      </li>
                    </ul>
                    {user?.plan === "professional" ? (
                      <Button disabled className="w-full mt-6">Current Plan</Button>
                    ) : (
                      <Button className="w-full mt-6">Upgrade</Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

export default Settings;
