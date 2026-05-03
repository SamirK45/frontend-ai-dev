import React from "react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Account Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account settings and preferences.
              </p>
            </div>

            {/* Add your settings options here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
