"use client";

import { isDomainAvailable } from "@/lib/resources";
import {
  Button,
  Center,
  Flex,
  Input,
  Box,
  Text,
  VStack,
  HStack,
  Progress,
  Badge,
  IconButton,
  SimpleGrid,
} from "@chakra-ui/react";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Challenge() {
  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState({});

  // This would be passed as a prop in a real application
  const numDomainsRequired = 5;

  const validateDomain = (domain: string) => {
    // Check if domain is bare (no protocol, no paths)
    if (domain.includes("://") || domain.includes("/")) {
      return {
        valid: false,
        message: "Domain should be bare (e.g., example.com)",
      };
    }

    // Check if domain ends with allowed TLDs
    const allowedTLDs = [".com", ".xyz", ".app"];
    const endsWithValidTLD = allowedTLDs.some((tld) =>
      domain.toLowerCase().endsWith(tld)
    );

    if (!endsWithValidTLD) {
      return {
        valid: false,
        message: `Domain must end with one of: ${allowedTLDs.join(", ")}`,
      };
    }

    // Additional check to ensure it's a properly formatted domain
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.(com|xyz|app)$/;
    if (!domainRegex.test(domain)) {
      return { valid: false, message: "Invalid domain format" };
    }

    return { valid: true };
  };

  const checkDomainAvailability = async (domain: string) => {
    try {
      const isAvailable = await isDomainAvailable(domain);
      setAvailabilityStatus((prev) => ({
        ...prev,
        [domain]: isAvailable,
      }));
    } catch (error) {
      console.error(`Error checking availability for ${domain}:`, error);
      setAvailabilityStatus((prev) => ({
        ...prev,
        [domain]: false,
      }));
    }
  };

  const handleAddDomain = async () => {
    if (!domainInput.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    const validation = validateDomain(domainInput);

    if (!validation.valid) {
      toast.error(`Invalid Domain: ${validation.message}`);
      return;
    }

    const lowerCaseDomain = domainInput.toLowerCase();

    if (domains.includes(lowerCaseDomain)) {
      toast.warning("This domain is already in your cart");
      return;
    }

    setDomains([...domains, lowerCaseDomain]);
    setDomainInput("");
    await checkDomainAvailability(lowerCaseDomain);

    toast.success(`Added ${lowerCaseDomain} to your cart`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddDomain();
    }
  };

  const removeDomain = (domainToRemove: string) => {
    setDomains(domains.filter((domain) => domain !== domainToRemove));
    // Remove from availability status as well to clean up
    const newAvailabilityStatus = { ...availabilityStatus };
    delete (newAvailabilityStatus as Record<string, boolean>)[domainToRemove];
    setAvailabilityStatus(newAvailabilityStatus);

    toast.info(`Removed ${domainToRemove} from your cart`);
  };

  const clearCart = () => {
    setDomains([]);
    setAvailabilityStatus({});
    toast.info("All domains have been removed from your cart");
  };

  const removeUnavailableDomains = () => {
    const availableDomains = domains.filter(
      (domain) => (availabilityStatus as Record<string, boolean>)[domain]
    );
    if (domains.length === availableDomains.length) {
      toast.info("There are no unavailable domains in your cart");
      return;
    }

    const removedCount = domains.length - availableDomains.length;
    setDomains(availableDomains);

    // Clean up availability status
    const newAvailabilityStatus = {};
    availableDomains.forEach((domain) => {
      (newAvailabilityStatus as Record<string, boolean>)[domain] = (
        availabilityStatus as Record<string, boolean>
      )[domain];
    });
    setAvailabilityStatus(newAvailabilityStatus);

    toast.success(`Removed ${removedCount} unavailable domain(s)`);
  };

  const copyDomainsToClipboard = () => {
    if (domains.length === 0) {
      toast.warning("There are no domains to copy");
      return;
    }

    const domainsString = domains.join(", ");
    navigator.clipboard
      .writeText(domainsString)
      .then(() => {
        toast.success(`${domains.length} domains copied to clipboard`);
      })
      .catch(() => {
        toast.error("Failed to copy domains to clipboard");
      });
  };

  const getDomainScore = (domain: string) => {
    let score = 0;

    // Score based on TLD
    if (domain.endsWith(".com")) score += 300;
    else if (domain.endsWith(".app")) score += 200;
    else if (domain.endsWith(".xyz")) score += 100;

    // Subtract length for shorter domains to score higher
    const domainWithoutTLD = domain.split(".")[0];
    score -= domainWithoutTLD.length;

    return score;
  };

  const keepBestDomains = () => {
    if (domains.length <= numDomainsRequired) {
      toast.info(
        `You already have ${domains.length} domains which is not more than required (${numDomainsRequired})`
      );
      return;
    }

    // Sort domains by score
    const sortedDomains = [...domains].sort((a, b) => {
      return getDomainScore(b) - getDomainScore(a);
    });

    // Keep only the top N domains
    const bestDomains = sortedDomains.slice(0, numDomainsRequired);
    setDomains(bestDomains);

    // Clean up availability status
    const newAvailabilityStatus = {};
    bestDomains.forEach((domain) => {
      if (domain in availabilityStatus) {
        (newAvailabilityStatus as Record<string, boolean>)[domain] = (
          availabilityStatus as Record<string, boolean>
        )[domain as keyof typeof availabilityStatus] as boolean;
      }
    });
    setAvailabilityStatus(newAvailabilityStatus);

    toast.success(
      `Kept the ${numDomainsRequired} best domains based on prioritization`
    );
  };

  const handlePurchase = () => {
    toast.success(`Purchase process started for ${domains.length} domains`);
  };

  // Calculate progress value as percentage
  const progressValue: number = (domains.length / numDomainsRequired) * 100;

  // Determine progress color based on cart status
  const progressColorScheme =
    domains.length > numDomainsRequired
      ? "red"
      : domains.length === numDomainsRequired
      ? "green"
      : "blue";

  return (
    <Center>
      <VStack gap={5} width="100%" maxWidth="600px" padding={4}>
        <Box width="100%">
          <Flex gap={2}>
            <Input
              placeholder="Enter domain name (e.g. example.com)"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button colorScheme="blue" onClick={handleAddDomain}>
              Add
            </Button>
          </Flex>
          <Text fontSize="xs" mt={1} color="gray.500">
            Valid formats: example.com, my-site.app, cool-domain.xyz
          </Text>
        </Box>

        <Box width="100%" borderWidth="1px" borderRadius="lg" p={4}>
          <Flex justify="space-between" mb={2}>
            <Text fontWeight="bold">
              Domain Cart ({domains.length}/{numDomainsRequired})
            </Text>
            <Text
              fontSize="sm"
              color={
                domains.length > numDomainsRequired ? "red.500" : "green.500"
              }
            >
              {domains.length > numDomainsRequired
                ? `Remove ${domains.length - numDomainsRequired} domain(s)`
                : domains.length < numDomainsRequired
                ? `Add ${numDomainsRequired - domains.length} more domain(s)`
                : "Ready to purchase!"}
            </Text>
          </Flex>
          <Progress.Root variant="outline">
            <Progress.Track>
              <Progress.Range
                style={{
                  width: `${progressValue}%`,
                  backgroundColor:
                    progressColorScheme === "red"
                      ? "red.500"
                      : progressColorScheme === "green"
                      ? "green.500"
                      : "blue.500",
                }}
              />
            </Progress.Track>
          </Progress.Root>
          {domains.length > 0 ? (
            <VStack align="stretch" gap={2} mt={2}>
              {domains.map((domain) => (
                <Flex
                  key={domain}
                  justify="space-between"
                  align="center"
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                >
                  <HStack>
                    <Text fontWeight="medium">{domain}</Text>
                    <Badge
                      colorScheme={
                        Object.prototype.hasOwnProperty.call(
                          availabilityStatus,
                          domain
                        ) === false
                          ? "gray"
                          : (availabilityStatus as Record<string, boolean>)[
                              domain
                            ]
                          ? "green"
                          : "red"
                      }
                    >
                      {Object.prototype.hasOwnProperty.call(
                        availabilityStatus,
                        domain
                      ) === false
                        ? "Checking..."
                        : (availabilityStatus as Record<string, boolean>)[
                            domain
                          ]
                        ? "Available"
                        : "Unavailable"}
                    </Badge>
                  </HStack>
                  <IconButton
                    size="sm"
                    colorScheme="red"
                    aria-label="Remove domain"
                    _icon={{
                      color: "red.500",
                    }}
                    onClick={() => removeDomain(domain)}
                  />
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" textAlign="center" py={4}>
              Your cart is empty. Add some domains!
            </Text>
          )}
          <Button
            colorScheme="green"
            width="100%"
            mt={4}
            disabled={domains.length !== numDomainsRequired}
            onClick={handlePurchase}
          >
            Purchase Domains
          </Button>
        </Box>

        <SimpleGrid columns={[1, 2]} gap={3} width="100%">
          <Button colorScheme="red" variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button
            colorScheme="orange"
            variant="outline"
            onClick={removeUnavailableDomains}
          >
            Remove Unavailable
          </Button>
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={copyDomainsToClipboard}
          >
            Copy to Clipboard
          </Button>
          <Button
            colorScheme="purple"
            variant="outline"
            onClick={keepBestDomains}
          >
            Keep Best {numDomainsRequired} Domains
          </Button>
        </SimpleGrid>

        {/* Add ToastContainer for react-toastify */}
        <ToastContainer position="bottom-right" />
      </VStack>
    </Center>
  );
}

export default Challenge;
