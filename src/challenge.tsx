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
import { toaster } from "./components/ui/toaster";
import { isDomainAvailable } from "./lib/resouces";

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
      toaster.create({
        title: "Error",
        description: "Please enter a domain",
        type: "error",
      });
      return;
    }

    const validation = validateDomain(domainInput);

    if (!validation.valid) {
      toaster.create({
        title: "Invalid Domain",
        description: validation.message,
        type: "error",
      });
      return;
    }

    const lowerCaseDomain = domainInput.toLowerCase();

    if (domains.includes(lowerCaseDomain)) {
      toaster.create({
        title: "Domain Already in Cart",
        description: "This domain is already in your cart",
        type: "warning",
      });
      return;
    }

    setDomains([...domains, lowerCaseDomain]);
    setDomainInput("");
    await checkDomainAvailability(lowerCaseDomain);

    toaster.create({
      title: "Domain Added",
      description: `Added ${lowerCaseDomain} to your cart`,
      type: "success",
    });
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

    toaster.create({
      title: "Domain Removed",
      description: `Removed ${domainToRemove} from your cart`,
      type: "info",
    });
  };

  const clearCart = () => {
    setDomains([]);
    setAvailabilityStatus({});
    toaster.create({
      title: "Cart Cleared",
      description: "All domains have been removed from your cart",
      type: "info",
    });
  };

  const removeUnavailableDomains = () => {
    const availableDomains = domains.filter(
      (domain) => (availabilityStatus as Record<string, boolean>)[domain]
    );
    if (domains.length === availableDomains.length) {
      toaster.create({
        title: "No Action Needed",
        description: "There are no unavailable domains in your cart",
        type: "info",
      });
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

    toaster.create({
      title: "Unavailable Domains Removed",
      description: `Removed ${removedCount} unavailable domain(s)`,
      type: "success",
    });
  };

  const copyDomainsToClipboard = () => {
    if (domains.length === 0) {
      toaster.create({
        title: "Empty Cart",
        description: "There are no domains to copy",
        type: "warning",
      });
      return;
    }

    const domainsString = domains.join(", ");
    navigator.clipboard
      .writeText(domainsString)
      .then(() => {
        toaster.create({
          title: "Copied to Clipboard",
          description: `${domains.length} domains copied to clipboard`,
          type: "success",
        });
      })
      .catch(() => {
        toaster.create({
          title: "Copy Failed",
          description: "Failed to copy domains to clipboard",
          type: "error",
        });
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
      toaster.create({
        title: "No Action Needed",
        description: `You already have ${domains.length} domains which is not more than required (${numDomainsRequired})`,
        type: "info",
      });
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

    toaster.create({
      title: "Kept Best Domains",
      description: `Kept the ${numDomainsRequired} best domains based on prioritization`,
      type: "success",
    });
  };

  const handlePurchase = () => {
    toaster.create({
      title: "Purchase Initiated",
      description: `Purchase process started for ${domains.length} domains`,
      type: "success",
    });
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
      </VStack>
    </Center>
  );
}

export default Challenge;
