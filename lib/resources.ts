//src/lib/resource.ts

export function isDomainAvailable(domain: string) {
  console.log("checking domain availability", domain);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() < 0.5); // 50% chance of availability
    }, 1000);
  });
}
