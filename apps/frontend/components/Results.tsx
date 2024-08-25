import { Card, CardContent } from "./ui/card";

// {
//   "3": [
//     "dfkdkf"
//   ],
//   "34": [
//     "dfkdkf"
//   ]
// }

interface ResultsProps {
  results: {
    [key: string]: string[];
  };
}

const Results: React.FC<ResultsProps> = ({ results }) => {
  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4">Voting Results</h2>
        <div className="space-y-6">
          {Object.entries(results).map(([voteValue, userNames]) => (
            <div
              key={voteValue}
              className="border-t pt-4 first:border-t-0 first:pt-0"
            >
              <h3 className="text-lg font-semibold mb-2">
                {voteValue} points - {userNames.length} vote
                {userNames.length !== 1 ? "s" : ""}
              </h3>
              <div className="flex items-center gap-4">
                {userNames.map((user) => (
                  <p key={user}>{user}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Results;
