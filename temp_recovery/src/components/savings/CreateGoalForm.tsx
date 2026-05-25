import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface CreateGoalFormProps {
  onCreateGoal: (name: string, targetAmount: number) => void;
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const CreateGoalForm = ({ onCreateGoal }: CreateGoalFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !targetAmount) return;
    
    onCreateGoal(goalName.trim(), parseFloat(targetAmount));
    setGoalName('');
    setTargetAmount('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full h-24 border-2 border-dashed border-muted-foreground/30 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        variant="ghost"
      >
        <div className="flex flex-col items-center gap-2">
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Add New Goal</span>
        </div>
      </Button>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Create New Goal</CardTitle>
            <CardDescription className="text-xs">Set a savings target to track</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goalName">Goal Name</Label>
            <Input
              id="goalName"
              placeholder="e.g., Emergency Fund, Vacation"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Amount (₹)</Label>
            <Input
              id="targetAmount"
              type="number"
              placeholder="e.g., 50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-background"
              min="1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={!goalName.trim() || !targetAmount}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateGoalForm;
