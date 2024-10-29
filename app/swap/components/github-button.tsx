import { GitHubLogoIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";

export const GithubButton = () => {
  return (
    <Button variant="ghost" size="icon">
      <GitHubLogoIcon className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Github Link</span>
    </Button>
  );
};
