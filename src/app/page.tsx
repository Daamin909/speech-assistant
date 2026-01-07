"use client";

import { Navbar01 } from "@/components/ui/shadcn-io/navbar-01";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const onClick = () => {
    console.log("hello");
    setHasStarted(true);
    audioRef.current?.play();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <audio src="/start_sound.mp3" className="" ref={audioRef} />
      {!hasStarted && (
        <Button
          size={"lg"}
          className="text-7xl w-fit h-fit py-5 px-7"
          onClick={onClick}
        >
          Start
        </Button>
      )}
    </div>
  );
}
