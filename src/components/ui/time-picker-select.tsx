import * as React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const defaultHorarios = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
    "22:00", "22:30", "23:00", "23:30", "00:00", "00:30"
];

interface TimePickerSelectProps {
    value: string | undefined; // HH:mm format
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TimePickerSelect({ value, onChange, placeholder = "Selecione o horário" }: TimePickerSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {defaultHorarios.map((hora) => (
                    <SelectItem key={hora} value={hora}>
                        {hora}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
