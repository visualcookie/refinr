import { PlayIcon, RotateCcwIcon, TimerIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface Props {
  votingPhase: "ended" | "voting" | "results";
  onStartVoting: () => void;
  onEndVoting: () => void;
  onResetVotes: () => void;
}

const Tools: React.FC<Props> = ({
  votingPhase,
  onStartVoting,
  onEndVoting,
  onResetVotes,
}) => {
  return (
    <Card className="mb-6 dark:bg-gray-800">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Moderator Controls
        </h2>
        <div className="flex gap-4">
          <Button onClick={onStartVoting} disabled={votingPhase === "voting"}>
            <PlayIcon className="mr-2 h-4 w-4" /> Start Voting
          </Button>
          <Button onClick={onEndVoting} disabled={votingPhase !== "voting"}>
            <TimerIcon className="mr-2 h-4 w-4" /> Show results
          </Button>
          <Button onClick={onResetVotes}>
            <RotateCcwIcon className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Tools;
