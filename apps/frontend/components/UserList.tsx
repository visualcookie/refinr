import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckIcon, CrownIcon } from "lucide-react";

interface User {
  clientId: string;
  name: string;
  isModerator?: boolean;
  votes?: string;
}

type UserListProps = {
  users: User[];
};

const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <div className="space-y-4">
      <h2 className="font-bold">Participants</h2>
      {users.map((user) => (
        <div key={user.clientId} className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="pointer-events-none select-none">
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-sm font-medium">{user.name}</span>
          {user.isModerator && (
            <div className="flex items-center justify-center rounded-full bg-yellow-500 w-6 h-6 ml-auto">
              <CrownIcon className="w-3 h-3" />
              <span className="sr-only">is a moderator</span>
            </div>
          )}
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
