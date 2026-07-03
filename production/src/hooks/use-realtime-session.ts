"use client";

import * as React from "react";

type RealtimeState = "idle" | "connecting" | "connected" | "listening" | "speaking" | "error";

interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface UseRealtimeSessionResult {
  state: RealtimeState;
  transcript: string;
  assistantText: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  muted: boolean;
}

export function useRealtimeSession(): UseRealtimeSessionResult {
  const [state, setState] = React.useState<RealtimeState>("idle");
  const [transcript, setTranscript] = React.useState("");
  const [assistantText, setAssistantText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [muted, setMuted] = React.useState(false);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const dcRef = React.useRef<RTCDataChannel | null>(null);
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);
  const micTrackRef = React.useRef<MediaStreamTrack | null>(null);

  const cleanup = React.useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    micTrackRef.current = null;
  }, []);

  const handleServerEvent = React.useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case "session.created":
      case "session.updated":
        setState("connected");
        break;

      case "input_audio_buffer.speech_started":
        setState("listening");
        setTranscript("");
        setAssistantText("");
        break;

      case "input_audio_buffer.speech_stopped":
        setState("connected");
        break;

      case "conversation.item.input_audio_transcription_completed":
        if (event.transcript) {
          setTranscript(String(event.transcript));
        }
        break;

      case "response.function_call_arguments.done":
        // Model wants to call search_policies — handled in data channel send
        break;

      case "response.output_audio.delta":
        setState("speaking");
        break;

      case "response.output_audio.done":
      case "response.done":
        setState("connected");
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          setAssistantText(String(event.transcript));
        }
        break;

      case "error":
        console.error("Realtime error:", event);
        const errObj = event as Record<string, unknown>;
        const errMsg = (typeof errObj.message === "string" ? errObj.message : undefined) ||
          (errObj.error && typeof errObj.error === "object" && "message" in errObj.error ? String((errObj.error as Record<string, unknown>).message) : undefined) ||
          "Realtime session error";
        setError(errMsg);
        setState("error");
        break;
    }
  }, []);

  const handleFunctionCall = React.useCallback(
    async (event: RealtimeEvent): Promise<string> => {
      if (event.name === "search_policies") {
        try {
          const args = JSON.parse(String(event.arguments || "{}"));
          const query = args.query || "";
          if (!query) return JSON.stringify({ answer: "No query provided", citations: [] });

          const res = await fetch("/api/voice/rag-tool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });

          if (!res.ok) {
            return JSON.stringify({ answer: "Policy search failed. Please try again.", citations: [] });
          }

          const data = await res.json();
          return JSON.stringify(data);
        } catch (err) {
          console.error("Function call error:", err);
          return JSON.stringify({ answer: "Policy search encountered an error.", citations: [] });
        }
      }
      return JSON.stringify({ error: "Unknown function" });
    },
    [],
  );

  const connect = React.useCallback(async () => {
    setState("connecting");
    setError("");
    setTranscript("");
    setAssistantText("");

    try {
      // 1. Fetch ephemeral token from our server
      const tokenRes = await fetch("/api/voice/realtime-token", { method: "POST" });
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Token fetch error:", errText);
        throw new Error("Failed to get realtime token");
      }
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.token;

      if (!ephemeralKey) throw new Error("No ephemeral token returned");

      // 2. Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Set up audio element for remote audio
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 4. Add local microphone track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = ms;
      micTrackRef.current = ms.getTracks()[0];
      pc.addTrack(micTrackRef.current);

      // 5. Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("[Realtime] Data channel opened");
      });

      pc.onconnectionstatechange = () => {
        console.log("[Realtime] PC connection state:", pc.connectionState);
      };

      dc.addEventListener("message", async (e) => {
        const event: RealtimeEvent = JSON.parse(e.data);
        console.log("[Realtime] event:", event.type, event);
        handleServerEvent(event);

        // Handle function call — try multiple event type patterns
        const isFunctionCall =
          event.type === "response.function_call_arguments.done" ||
          event.type === "conversation.item.created" && (event.item as Record<string, unknown>)?.type === "function_call";

        if (isFunctionCall) {
          const callId = (event.call_id || (event.item as Record<string, unknown>)?.call_id) as string;
          const fnName = (event.name || (event.item as Record<string, unknown>)?.name) as string;
          const fnArgs = (event.arguments || (event.item as Record<string, unknown>)?.arguments) as string;

          console.log("[Realtime] Function call detected:", fnName, fnArgs, "call_id:", callId);

          if (callId) {
            // Build a fake event for handleFunctionCall
            const fakeEvent: RealtimeEvent = {
              type: event.type,
              name: fnName,
              arguments: fnArgs,
              call_id: callId,
            };
            const result = await handleFunctionCall(fakeEvent);
            console.log("[Realtime] Function call result:", result.slice(0, 200));

            // Send the function call result back to the model
            dc.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: callId,
                  output: result,
                },
              }),
            );
            // Trigger the model to continue with the function result
            dc.send(JSON.stringify({ type: "response.create" }));
          }
        }
      });

      // 6. Create SDP offer and negotiate
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpRes.ok) {
        const errText = await sdpRes.text();
        console.error("SDP negotiation error:", errText);
        throw new Error("Failed to negotiate WebRTC connection");
      }

      const answer = { type: "answer" as RTCSdpType, sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);

      setState("connected");
    } catch (err) {
      console.error("Realtime connection error:", err);
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Connection failed";
      setError(message);
      setState("error");
      cleanup();
    }
  }, [cleanup, handleServerEvent, handleFunctionCall]);

  const disconnect = React.useCallback(() => {
    cleanup();
    setState("idle");
    setTranscript("");
    setAssistantText("");
    setError("");
  }, [cleanup]);

  const toggleMute = React.useCallback(() => {
    if (micTrackRef.current) {
      micTrackRef.current.enabled = !micTrackRef.current.enabled;
      setMuted(!micTrackRef.current.enabled);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    transcript,
    assistantText,
    error,
    connect,
    disconnect,
    toggleMute,
    muted,
  };
}
