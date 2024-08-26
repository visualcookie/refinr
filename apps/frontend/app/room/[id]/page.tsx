"use client";

import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import UserList from "@/components/UserList";
import Tools from "@/components/Tools";
import Results from "@/components/Results";
import FormUsername from "@/components/FormUsername";

let socket: Socket;

const storyPoints = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "89",
  "?",
];

interface Votes {
  [key: string]: string;
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [user, setUser] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [moderatorId, setModeratorId] = useState<string | null>(null);
  const [votingPhase, setVotingPhase] = useState<
    "ended" | "voting" | "results"
  >("ended");
  const [votes, setVotes] = useState<Votes>({});
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasUsername, setHasUsername] = useState<boolean>(false);

  useEffect(() => {
    const getUserfromLocalStorage = localStorage.getItem("name")
      ? localStorage.getItem("name")
      : null;

    if (getUserfromLocalStorage) {
      setHasUsername(true);
      setUser(getUserfromLocalStorage);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    if (id && hasUsername) {
      socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}`);
      console.debug("Connecting to WebSocket server...");

      socket.emit("joinRoom", { roomId: id, user });

      socket.on("userJoined", (roomData) => {
        console.debug("userJoined", roomData);
        setUsers(roomData.users);
        setModeratorId(roomData.moderatorId);
        setVotingPhase(roomData.votingPhase);
        setVotes(roomData.votes);
      });

      socket.on("userLeft", (userList) => {
        setUsers(userList);
      });

      socket.on("userVoted", (roomVotes) => {
        setVotes(roomVotes);
      });

      socket.on("changedVotingPhase", (roomData) => {
        setVotingPhase(roomData.votingPhase);
      });

      socket.on("resetVotes", () => {
        setVotes({});
        setSelectedCard(null);
      });

      return () => {
        socket.disconnect();
        console.debug("Disconnected from WebSocket server");
      };
    }
  }, [hasUsername, id, user]);

  const handleVotingPhaseChange = (phase: "ended" | "voting" | "results") => {
    socket.emit("changeVotingPhase", { roomId: id, votingPhase: phase });
  };

  const handleResetVoting = () => {
    socket.emit("changeVotingPhase", { roomId: id, votingPhase: "ended" });
    socket.emit("resetVotes", { roomId: id });
  };

  const handleVote = (voteValue: string) => {
    setSelectedCard(voteValue);
    socket.emit("vote", { roomId: id, vote: voteValue });
  };

  const handleSubmit = (data: any) => {
    localStorage.setItem("name", data.name);
    setUser(data.name);
    setHasUsername(true);
  };

  const groupedVotes = useMemo(() => {
    const groupedVotes: { [key: string]: string[] } = {};
    const clientIdToNameMap: { [clientId: string]: string } = {};

    users.forEach((u) => {
      clientIdToNameMap[u.clientId] = u.name;
    });

    for (const socketId in votes) {
      const voteValue = votes[socketId];

      if (!groupedVotes[voteValue]) {
        groupedVotes[voteValue] = [];
      }

      const userName = clientIdToNameMap[socketId];

      if (userName) {
        groupedVotes[voteValue].push(userName);
      }
    }

    return groupedVotes;
  }, [votes, users]);

  const transformedUsers = useMemo(() => {
    return users.map((u) => ({
      ...u,
      isModerator: u.clientId === moderatorId,
      votes: votes[u.clientId],
    }));
  }, [moderatorId, users, votes]);

  const isModerator = useMemo(() => {
    const currentUser = transformedUsers.find((u) => u.name === user);
    return currentUser?.isModerator;
  }, [transformedUsers, user]);

  return (
    <>
      {!hasUsername ? (
        <FormUsername handleSubmit={handleSubmit} />
      ) : (
        <div className="flex h-screen bg-background">
          <div className="w-64 p-4 border-r bg-muted/40">
            <UserList users={transformedUsers} />
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Story Poker</h1>

            {isModerator && (
              <Tools
                votingPhase={votingPhase}
                onStartVoting={() => handleVotingPhaseChange("voting")}
                onEndVoting={() => handleVotingPhaseChange("results")}
                onResetVotes={handleResetVoting}
              />
            )}

            {!isModerator && votingPhase === "ended" && (
              <p className="text-muted-foreground mb-6">
                The voting phase has ended or not started yet.
              </p>
            )}

            {votingPhase === "voting" && !isModerator && (
              <>
                <p className="text-muted-foreground mb-6">
                  Select a card to estimate the story points:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {storyPoints.map((point) => (
                    <Button
                      key={point}
                      variant={selectedCard === point ? "default" : "outline"}
                      className={`h-24 text-2xl font-bold ${
                        selectedCard === point ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleVote(point)}
                    >
                      {point}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {votingPhase === "results" && <Results results={groupedVotes} />}
          </div>
        </div>
      )}
    </>
  );
}
