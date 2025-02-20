import { useState, useEffect } from "@wordpress/element";
import { Button, SelectControl, TextControl } from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { AdminSettings, ApiKeyResponse } from "../../types/admin-types";

import { SettingsTab } from "./tabs/SettingsTab";
