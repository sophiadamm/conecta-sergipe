import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

type Option = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select items...",
    className,
}: MultiSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item));
    };

    const handleSelect = (item: string) => {
        setInputValue("");
        if (selected.includes(item)) {
            handleUnselect(item);
        } else {
            onChange([...selected, item]);
        }
    };

    const selectables = options.filter((skill) => !selected.includes(skill));

    return (
        <Command onKeyDown={(e) => {
            if (e.key === "Backspace" && !inputValue) {
                e.preventDefault();
                if (selected.length > 0) {
                    handleUnselect(selected[selected.length - 1]);
                }
            }
            if (e.key === "Escape") {
                inputRef.current?.blur();
            }
        }} className={cn("overflow-visible bg-transparent", className)}>
            <div
                className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
                <div className="flex gap-1 flex-wrap">
                    {selected.map((skill) => {
                        return (
                            <Badge key={skill} variant="secondary">
                                {skill}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleUnselect(skill);
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={() => handleUnselect(skill)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        );
                    })}
                    {/* Avoid having the command input behave as a controlled component with value in a way that conflicts with cmdk */}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ? (
                    <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandEmpty>Nenhuma habilidade encontrada.</CommandEmpty>
                            {/* Empty state specifically for when search yields no results */}
                            {/* Note: CommandEmpty only shows if the search term filters everything out */}
                            <CommandGroup className="h-full overflow-auto max-h-60">
                                {selectables.map((skill) => {
                                    return (
                                        <CommandItem
                                            key={skill}
                                            onSelect={() => {
                                                handleSelect(skill);
                                                // Keep input focused
                                                // inputRef.current?.focus(); 
                                                // No need to refocus if we prevent blur, but safe to keep
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {skill}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </div>
                ) : null}
            </div>
        </Command>
    );
}
