import Challenge from "@/components/challenge";
import { Center, Theme } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";

export default function Home() {
  return (
    <Theme appearance="dark">
      <Center h="100vh">
        <Challenge />
        <ToastContainer position="bottom-right" />
      </Center>
    </Theme>
  );
}
