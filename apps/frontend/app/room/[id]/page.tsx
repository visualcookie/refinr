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

interface Events {}

interface Votes {
  [key: string]: string;
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [users, setUsers] = useState<any[]>([]);
  const [isModerator, setIsModerator] = useState<boolean>(false);
  const [moderatorId, setModeratorId] = useState<string | null>(null);
  const [votingPhase, setVotingPhase] = useState<
    "ended" | "voting" | "results"
  >("ended");
  const [votes, setVotes] = useState<Votes>({});
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasUsername, setHasUsername] = useState<boolean>(false);
  const username = localStorage.getItem("name") ?? "";

  useEffect(() => {
    if (username) {
      setHasUsername(true);
    }
  }, [username]);

  useEffect(() => {
    if (!id) return;

    if (id && username) {
      socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}`);
      console.debug("Connecting to WebSocket server...");

      socket.emit("joinRoom", { roomId: id, name: username });

      // Receive room users
      socket.on("roomUsers", (socketUsers: any[]) => {
        console.debug("Received users list:", socketUsers);
        setUsers(socketUsers);
      });

      // Receive room moderator
      socket.on("moderator", (moderatorId: string) => {
        console.debug("Moderator ID:", moderatorId);
        setModeratorId(moderatorId);
        setIsModerator(socket.id === moderatorId);
      });

      // Receive voting phase
      socket.on("votingPhase", (phase: "ended" | "voting" | "results") => {
        console.debug("Sync voting phase:", phase);
        setVotingPhase(phase);
      });

      // Receive voting results
      socket.on("votingResults", (results) => {
        console.debug("Voting results:", results);
        setVotes(results);
      });

      // Receive vote from user
      socket.on("voteReceived", (receivedVotes) => {
        setVotes(receivedVotes);
      });

      // Receive reset votes
      socket.on("resetVotes", () => {
        setVotes({});
        setSelectedCard(null);
      });

      return () => {
        socket.disconnect();
        console.debug("Disconnected from WebSocket server");
      };
    }
  }, [id, username]);

  const handleStartVoting = () => {
    socket.emit("startVoting", id);
  };

  const handleEndVoting = () => {
    socket.emit("endVoting", id);
  };

  const handleResetVoting = () => {
    socket.emit("resetVoting", id);
  };

  const handleVote = (voteValue: string) => {
    socket.emit("giveVote", { roomId: id, vote: voteValue });
    setSelectedCard(voteValue);
  };

  const handleSubmit = (data: any) => {
    localStorage.setItem("name", data.name);
    setHasUsername(true);
  };

  const groupedVotes = useMemo(() => {
    const groupedVotes: { [key: string]: string[] } = {};
    const clientIdToNameMap: { [clientId: string]: string } = {};

    users.forEach((user) => {
      clientIdToNameMap[user.clientId] = user.name;
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

  // TODO: Let the socket return this logic
  const transformedUsers = users.map((user) => ({
    ...user,
    isModerator: user.clientId === moderatorId,
    votes: votes[user.clientId],
  }));

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
                onStartVoting={handleStartVoting}
                onEndVoting={handleEndVoting}
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
