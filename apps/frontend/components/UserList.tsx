import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckIcon, CrownIcon } from "lucide-react";

type User = {
  id: string;
  name: string;
  isModerator?: boolean;
  votes?: string;
};

const UserList: React.FC<{ users: User[] }> = ({ users }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Participants</h2>
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-2">
          <div className="relative">
            <Avatar>
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {user.isModerator && (
              <CrownIcon className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
            )}
          </div>
          <span className="text-sm font-medium">{user.name}</span>
          {user.votes && (
            <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full ml-auto">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span className="sr-only">has voted</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserList;
