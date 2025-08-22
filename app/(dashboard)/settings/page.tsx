"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUIStore } from "@/store";
import {
  User,
  Settings,
  Shield,
  Bell,
  Palette,
  LogOut,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Activity,
  Target,
} from "lucide-react";
import type { ProfileSetupForm } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile, updateProfile, loading: profileLoading } = useUserProfile();
  const { theme, setTheme, showSuccess, showError } = useUIStore();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Form state
  const [formData, setFormData] = useState<Partial<ProfileSetupForm>>({
    name: profile?.name || "",
    gender: profile?.gender || undefined,
    height: profile?.height || undefined,
    weight: profile?.weight || undefined,
    dateOfBirth: profile?.dateOfBirth
      ? new Date(profile.dateOfBirth)
      : undefined,
    activityLevel: profile?.activityLevel || "MODERATE",
    dietaryGoals: (profile?.dietaryGoals as any) || "MAINTENANCE",
  });

  // Notification preferences (mock for now)
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    goalAchievements: true,
    weeklyReports: false,
    productUpdates: false,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(formData);
      showSuccess(
        "Profile Updated",
        "Your profile has been updated successfully."
      );
    } catch (error) {
      showError(
        "Update Failed",
        "Failed to update profile. Please try again.",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (profileLoading) {
    return <SettingsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.primaryEmailAddress?.emailAddress || ""}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Managed by Clerk authentication
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={
                        formData.dateOfBirth
                          ? new Date(formData.dateOfBirth)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value
                            ? new Date(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="PREFER_NOT_TO_SAY">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="height" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          height: Number(e.target.value),
                        })
                      }
                      placeholder="170"
                      min="100"
                      max="250"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weight: Number(e.target.value),
                        })
                      }
                      placeholder="70"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                  </div>
                </div>

                {formData.height && formData.weight && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your BMI is{" "}
                      <strong>
                        {(
                          formData.weight / Math.pow(formData.height / 100, 2)
                        ).toFixed(1)}
                      </strong>
                      . This is classified as{" "}
                      <Badge variant="secondary">
                        {getBMICategory(
                          formData.weight / Math.pow(formData.height / 100, 2)
                        )}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Lifestyle & Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Lifestyle & Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Level
                  </Label>
                  <Select
                    value={formData.activityLevel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, activityLevel: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDENTARY">
                        Sedentary (little to no exercise)
                      </SelectItem>
                      <SelectItem value="LIGHT">
                        Light (1-3 days/week)
                      </SelectItem>
                      <SelectItem value="MODERATE">
                        Moderate (3-5 days/week)
                      </SelectItem>
                      <SelectItem value="ACTIVE">
                        Active (6-7 days/week)
                      </SelectItem>
                      <SelectItem value="VERY_ACTIVE">
                        Very Active (2x/day or intense)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Dietary Goal
                  </Label>
                  <Select
                    value={formData.dietaryGoals}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dietaryGoals: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEIGHT_LOSS">Lose Weight</SelectItem>
                      <SelectItem value="MAINTENANCE">
                        Maintain Weight
                      </SelectItem>
                      <SelectItem value="MUSCLE_GAIN">Gain Muscle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">User ID</p>
                    <p className="text-sm text-gray-600">{user?.id}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>~
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-gray-600">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Last Sign In</p>
                    <p className="text-sm text-gray-600">
                      {user?.lastSignInAt
                        ? new Date(user.lastSignInAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These actions are permanent and cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                  disabled
                >
                  Delete Account (Contact Support)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {formatNotificationKey(key)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getNotificationDescription(key)}
                      </p>
                    </div>
                    <Button
                      variant={value ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setNotifications({ ...notifications, [key]: !value })
                      }
                    >
                      {value ? <Check className="h-4 w-4" /> : "Off"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Email notifications are sent to{" "}
              <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="cursor-pointer">
                    Light Mode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="cursor-pointer">
                    Dark Mode
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                More display options coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function formatNotificationKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    mealReminders: "Get reminded to log your meals",
    goalAchievements: "Celebrate when you reach your goals",
    weeklyReports: "Receive weekly nutrition summaries",
    productUpdates: "Stay informed about new features",
  };
  return descriptions[key] || "";
}

// Loading skeleton
function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="h-12 bg-gray-200 rounded w-full max-w-md animate-pulse" />
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
