# Devices & Endpoint Management - Microsoft Graph API

This resource covers device management via Microsoft Intune, including mobile device management (MDM), mobile application management (MAM), and device compliance.

## Base Endpoints

- Devices: `https://graph.microsoft.com/v1.0/devices`
- Managed Devices: `https://graph.microsoft.com/v1.0/deviceManagement/managedDevices`
- Device Configurations: `https://graph.microsoft.com/v1.0/deviceManagement/deviceConfigurations`

## Devices (Azure AD)

### List Devices
```http
GET /devices
GET /devices?$select=displayName,operatingSystem,operatingSystemVersion
```

### Get Device
```http
GET /devices/{device-id}
```

### Get User's Devices
```http
GET /users/{user-id}/registeredDevices
GET /users/{user-id}/ownedDevices
```

### Update Device
```http
PATCH /devices/{device-id}
{
  "accountEnabled": false
}
```

### Delete Device
```http
DELETE /devices/{device-id}
```

**Required Permissions:** `Device.ReadWrite.All`, `Directory.ReadWrite.All`

---

## Managed Devices (Intune)

### List Managed Devices
```http
GET /deviceManagement/managedDevices
```

### Get Managed Device
```http
GET /deviceManagement/managedDevices/{device-id}
```

### Get User's Managed Devices
```http
GET /users/{user-id}/managedDevices
```

### Filter Managed Devices
```http
# By operating system
GET /deviceManagement/managedDevices?$filter=operatingSystem eq 'iOS'

# Non-compliant devices
GET /deviceManagement/managedDevices?$filter=complianceState eq 'noncompliant'

# By management state
GET /deviceManagement/managedDevices?$filter=managementState eq 'managed'
```

### Remote Actions

#### Retire Device
```http
POST /deviceManagement/managedDevices/{device-id}/retire
```

Removes company data, keeps personal data.

#### Wipe Device
```http
POST /deviceManagement/managedDevices/{device-id}/wipe
{
  "keepEnrollmentData": false,
  "keepUserData": false
}
```

Factory resets the device.

#### Lock Device
```http
POST /deviceManagement/managedDevices/{device-id}/remoteLock
```

#### Reboot Device
```http
POST /deviceManagement/managedDevices/{device-id}/rebootNow
```

#### Sync Device
```http
POST /deviceManagement/managedDevices/{device-id}/syncDevice
```

#### Reset Passcode
```http
POST /deviceManagement/managedDevices/{device-id}/resetPasscode
```

#### Locate Device
```http
POST /deviceManagement/managedDevices/{device-id}/locateDevice
```

**Required Permissions:** `DeviceManagementManagedDevices.ReadWrite.All`

---

## Device Configurations

### List Configuration Policies
```http
GET /deviceManagement/deviceConfigurations
```

### Get Configuration
```http
GET /deviceManagement/deviceConfigurations/{config-id}
```

### Create Configuration
```http
POST /deviceManagement/deviceConfigurations
{
  "@odata.type": "#microsoft.graph.iosGeneralDeviceConfiguration",
  "displayName": "iOS Restrictions",
  "iCloudBlockBackup": true,
  "iCloudBlockPhotoStreamSync": true
}
```

### Assign Configuration
```http
POST /deviceManagement/deviceConfigurations/{config-id}/assignments
{
  "target": {
    "@odata.type": "#microsoft.graph.allDevicesAssignmentTarget"
  }
}
```

**Assignment targets:**
- `allDevicesAssignmentTarget` - All devices
- `allLicensedUsersAssignmentTarget` - All users
- `groupAssignmentTarget` - Specific group
- `exclusionGroupAssignmentTarget` - Exclude group

---

## Compliance Policies

### List Compliance Policies
```http
GET /deviceManagement/deviceCompliancePolicies
```

### Get Compliance Policy
```http
GET /deviceManagement/deviceCompliancePolicies/{policy-id}
```

### Create Compliance Policy
```http
POST /deviceManagement/deviceCompliancePolicies
{
  "@odata.type": "#microsoft.graph.androidCompliancePolicy",
  "displayName": "Android Compliance",
  "passwordRequired": true,
  "passwordMinimumLength": 8,
  "deviceThreatProtectionEnabled": true,
  "deviceThreatProtectionRequiredSecurityLevel": "secured"
}
```

### Get Device Compliance Status
```http
GET /deviceManagement/managedDevices/{device-id}/deviceCompliancePolicyStates
```

---

## Enrollment

### Enrollment Configurations

#### List Configurations
```http
GET /deviceManagement/deviceEnrollmentConfigurations
```

#### Create Enrollment Restriction
```http
POST /deviceManagement/deviceEnrollmentConfigurations
{
  "@odata.type": "#microsoft.graph.deviceEnrollmentPlatformRestrictionsConfiguration",
  "displayName": "Platform Restrictions",
  "iosRestriction": {
    "platformBlocked": false,
    "personalDeviceEnrollmentBlocked": true
  }
}
```

### Enrollment Programs

#### Apple DEP
```http
GET /deviceManagement/depOnboardingSettings
```

#### Windows Autopilot
```http
GET /deviceManagement/windowsAutopilotDeviceIdentities
```

---

## App Management

### Mobile Apps

#### List Apps
```http
GET /deviceManagement/mobileApps
```

#### Get App
```http
GET /deviceManagement/mobileApps/{app-id}
```

#### Create iOS Store App
```http
POST /deviceManagement/mobileApps
{
  "@odata.type": "#microsoft.graph.iosStoreApp",
  "displayName": "Company App",
  "publisher": "Contoso",
  "bundleId": "com.contoso.app",
  "appStoreUrl": "https://apps.apple.com/app/id123456789"
}
```

#### Assign App
```http
POST /deviceManagement/mobileApps/{app-id}/assignments
{
  "intent": "required",
  "target": {
    "@odata.type": "#microsoft.graph.groupAssignmentTarget",
    "groupId": "{group-id}"
  }
}
```

**Intents:**
- `available` - Available for install
- `required` - Required, auto-install
- `uninstall` - Uninstall if present
- `availableWithoutEnrollment` - Available without enrollment

### App Protection Policies (MAM)

#### List Policies
```http
GET /deviceManagement/managedAppPolicies
```

#### Create iOS App Protection Policy
```http
POST /deviceManagement/iosManagedAppProtections
{
  "displayName": "iOS MAM Policy",
  "periodOfflineBeforeAccessCheck": "PT12H",
  "periodOnlineBeforeAccessCheck": "PT30M",
  "allowedDataStorageLocations": ["oneDriveForBusiness", "sharePoint"],
  "allowedInboundDataTransferSources": "managedApps",
  "allowedOutboundDataTransferDestinations": "managedApps",
  "organizationalCredentialsRequired": false,
  "dataBackupBlocked": true,
  "deviceComplianceRequired": true,
  "managedBrowserToOpenLinksRequired": false,
  "saveAsBlocked": true,
  "periodOfflineBeforeWipeIsEnforced": "P90D"
}
```

#### Assign App Protection Policy
```http
POST /deviceManagement/iosManagedAppProtections/{policy-id}/assignments
{
  "target": {
    "@odata.type": "#microsoft.graph.groupAssignmentTarget",
    "groupId": "{group-id}"
  }
}
```

---

## Windows Updates

### Update Policies

#### List Update Policies
```http
GET /deviceManagement/windowsUpdateForBusinessConfigurations
```

#### Create Update Policy
```http
POST /deviceManagement/windowsUpdateForBusinessConfigurations
{
  "displayName": "Windows Update Policy",
  "qualityUpdatesDeferralPeriodInDays": 7,
  "featureUpdatesDeferralPeriodInDays": 30,
  "deliveryOptimizationMode": "httpWithPeeringNat"
}
```

---

## Device Categories

### List Categories
```http
GET /deviceManagement/deviceCategories
```

### Create Category
```http
POST /deviceManagement/deviceCategories
{
  "displayName": "Sales Devices"
}
```

### Assign Device to Category
```http
PUT /deviceManagement/managedDevices/{device-id}/deviceCategory/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/deviceManagement/deviceCategories/{category-id}"
}
```

---

## Reports

### Device Compliance Report
```http
POST /deviceManagement/reports/getCompliancePolicyNonComplianceReport
{
  "filter": "",
  "select": [],
  "skip": 0,
  "top": 50
}
```

### Device Configuration Report
```http
POST /deviceManagement/reports/getDeviceConfigurationPolicyStatusReport
{
  "filter": "",
  "select": [],
  "skip": 0,
  "top": 50
}
```

---

## Apple Push Notification Certificate

### Get APNs Certificate
```http
GET /deviceManagement/applePushNotificationCertificate
```

### Upload APNs Certificate
```http
PATCH /deviceManagement/applePushNotificationCertificate
{
  "appleIdentifier": "admin@contoso.com",
  "certificate": "BASE64_CERTIFICATE"
}
```

---

## Terms and Conditions

### List Terms
```http
GET /deviceManagement/termsAndConditions
```

### Create Terms
```http
POST /deviceManagement/termsAndConditions
{
  "displayName": "Company Terms of Use",
  "bodyText": "Terms and conditions text...",
  "acceptanceStatement": "I accept the terms and conditions"
}
```

### Get Acceptance Status
```http
GET /deviceManagement/termsAndConditions/{terms-id}/acceptanceStatuses
```

---

## Permissions Reference

### Delegated Permissions
- `Device.Read.All` - Read devices
- `Device.ReadWrite.All` - Read and write devices
- `DeviceManagementConfiguration.Read.All` - Read configuration
- `DeviceManagementConfiguration.ReadWrite.All` - Manage configuration
- `DeviceManagementManagedDevices.Read.All` - Read managed devices
- `DeviceManagementManagedDevices.ReadWrite.All` - Manage devices
- `DeviceManagementApps.Read.All` - Read apps
- `DeviceManagementApps.ReadWrite.All` - Manage apps

### Application Permissions
- `Device.Read.All` - Read all devices
- `Device.ReadWrite.All` - Read and write all devices
- `DeviceManagementConfiguration.Read.All` - Read all configuration
- `DeviceManagementManagedDevices.Read.All` - Read all managed devices
- `DeviceManagementApps.Read.All` - Read all apps

---

## Common Patterns

### Enforce Compliance
```http
# 1. Create compliance policy
POST /deviceManagement/deviceCompliancePolicies
{...}

# 2. Assign to group
POST /deviceManagement/deviceCompliancePolicies/{policy-id}/assignments
{...}

# 3. Create conditional access policy requiring compliance
POST /identity/conditionalAccess/policies
{
  "grantControls": {"builtInControls": ["compliantDevice"]}
}
```

### Deploy App to Group
```http
# 1. Upload/register app
POST /deviceManagement/mobileApps
{...}

# 2. Assign to group
POST /deviceManagement/mobileApps/{app-id}/assignments
{
  "intent": "required",
  "target": {"groupId": "{group-id}"}
}
```

### Remote Wipe Lost Device
```http
# 1. Locate device
POST /deviceManagement/managedDevices/{device-id}/locateDevice

# 2. If confirmed lost, wipe
POST /deviceManagement/managedDevices/{device-id}/wipe
{
  "keepUserData": false
}
```

---

## Best Practices

1. **Use compliance policies** before conditional access
2. **Test configurations** on pilot group first
3. **Enable device enrollment restrictions** appropriately
4. **Use app protection policies** (MAM) for BYOD
5. **Regular compliance reporting** to identify issues
6. **Document remote actions** taken
7. **Use device categories** for organization
8. **Implement update rings** for gradual rollout
9. **Monitor APNs certificate** expiration
10. **Regular review** of assigned policies
