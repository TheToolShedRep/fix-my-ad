// SurveyModel.tsx

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { upsertSurveyResponse } from "@/utils/survey";
import { useUser } from "@clerk/nextjs";

export function SurveyModal({
  projectId,
  openInitially = false,
  open: externalOpen,
  setOpen: setExternalOpen,
}: {
  projectId?: string;
  openInitially?: boolean;
  open?: boolean;
  setOpen?: (val: boolean) => void;
}) {
  const { user } = useUser();
  // const [open, setOpen] = useState(false);
  const [productType, setProductType] = useState("");
  const [platform, setPlatform] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  // const [open, setOpen] = useState(openInitially);
  const [internalOpen, setInternalOpen] = useState(openInitially);
  const open = externalOpen ?? internalOpen;
  const setOpen = setExternalOpen ?? setInternalOpen;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await upsertSurveyResponse({
        user_email: user?.primaryEmailAddress?.emailAddress || "",
        project_id: projectId,
        product_type: productType,
        platform,
        goal,
        notes,
      });
      setOpen(false);
    } catch (err) {
      alert("Failed to save survey. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Survey</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="productType">Product Type</Label>
            <Input
              id="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g. Haircare, Mobile App, Service"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Input
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. TikTok, YouTube, Instagram"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Main Goal</Label>
            <Input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Get followers, Drive purchases"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Optional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra context or background info?"
              className="text-gray-900"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SurveyModal;
