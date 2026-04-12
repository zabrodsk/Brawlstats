import React from "react";
import { Composition } from "remotion";
import { HeroBg } from "./HeroBg";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="HeroBg"
        component={HeroBg}
        durationInFrames={300} // 10 seconds at 30fps — clean loop
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
}
