import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/lib/news-context";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — News Chronicle AI" },
      {
        name: "description",
        content:
          "Configure extraction quality, default report language and source preferences for News Chronicle AI.",
      },
      { property: "og:title", content: "Settings — News Chronicle AI" },
      {
        property: "og:description",
        content: "Configure extraction, translation and source preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Preferences for extraction, translation and reporting.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Translation</CardTitle>
          <CardDescription>Defaults applied to every generated timeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="default-language">Default report language</Label>
            <Select defaultValue="English">
              <SelectTrigger id="default-language" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="keep-original">Always keep original text</Label>
              <p className="text-xs text-muted-foreground">
                Store the native-language snippet alongside each translation.
              </p>
            </div>
            <Switch id="keep-original" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingestion</CardTitle>
          <CardDescription>How newspapers are processed after upload.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-extract">Auto-start extraction</Label>
              <p className="text-xs text-muted-foreground">
                Begin text extraction as soon as a file lands.
              </p>
            </div>
            <Switch id="auto-extract" defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="detect-language">Detect language automatically</Label>
              <p className="text-xs text-muted-foreground">
                Tag each document with its detected publication language.
              </p>
            </div>
            <Switch id="detect-language" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
