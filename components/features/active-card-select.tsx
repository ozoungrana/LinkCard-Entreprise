"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ActiveCardSelect({
  cards,
  activeId,
}: {
  cards: { id: string; name: string }[];
  activeId: string;
}) {
  const router = useRouter();

  return (
    <Select value={activeId} onValueChange={(id) => router.push(`/dashboard?card=${id}`)}>
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {cards.map((card) => (
          <SelectItem key={card.id} value={card.id}>
            {card.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
