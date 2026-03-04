import { useState, useEffect } from "react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectTrigger, SelectItem, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { BusinessHours } from "@/lib/interfaces";

const dayLabels: Record<string, string> = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday"
};

export function formatHours(formData: BusinessHours): string {
  const result: Record<string, string> = {};
  Object.keys(dayLabels).forEach((day) => {
    const dayData = formData[day];
    result[day] = dayData.is_open 
      ? `${dayLabels[day]}: ${dayData.open} AM - ${dayData.close} PM ` 
      : `${dayLabels[day]}: Closed `;
  });
  return Object.values(result).join("\n");
}

const HoursOfOperation = ({ callback, hours }: { callback: (formData: BusinessHours) => void, hours?: BusinessHours }) => {
  const hourOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState<BusinessHours>({
    sunday: { open: "", close: "", is_open: true },
    monday: { open: "", close: "", is_open: true },
    tuesday: { open: "", close: "", is_open: true },
    wednesday: { open: "", close: "", is_open: true },
    thursday: { open: "", close: "", is_open: true },
    friday: { open: "", close: "", is_open: true },
    saturday: { open: "", close: "", is_open: true }
  });
  const [formattedHours, setFormattedHours] = useState<string>('');
  
  useEffect(() => {
    if (hours) {
      try {
        setFormData(hours);
        const formatted = formatHours(hours);
        setFormattedHours(formatted);
        setIsEditing(false);
      } catch (e) {
        console.error("Failed to parse hours", e);
      }
    }
  }, [hours]);

  const validateHours = (data: BusinessHours) => {
    // each day must either be closed or have both open and close set
    return Object.values(data).every(day => {
      if (day.is_open) {
        return Boolean(day.open && day.close);
      }
      return true;
    });
  };

  const handleSubmit = () => {
    if (!validateHours(formData)) {
      // simple UX: early return, you could wire up a toast or error state instead
      alert("Please provide both opening and closing times for any day marked as open, or mark it closed.");
      return;
    }

    const formatted = formatHours(formData);
    setFormattedHours(formatted);
    setIsEditing(false);
    callback(formData);
  };

  const renderDayRow = (day: string) => (
    <div key={day} className="flex flex-row items-center gap-4 py-3">
      <Label className="min-w-[100px]">{dayLabels[day]}:</Label>
      <div className="flex flex-row items-center gap-2 flex-1">
        <Select 
          defaultValue=""
          value={formData[day].open} 
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, [day]: { ...prev[day], open: value } }));
          }}
        >
          <SelectTrigger className="w-[120px]" disabled={!formData[day].is_open}>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={`${day}-open-${hour}`} value={hour}>
                {hour} AM
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-lg">–</span>

        <Select 
          defaultValue=""
          value={formData[day].close} 
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, [day]: { ...prev[day], close: value } }));
          }}
        >
          <SelectTrigger className="w-[120px]" disabled={!formData[day].is_open}>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={`${day}-close-${hour}`} value={hour}>
                {hour} PM
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-4">
          <Checkbox 
            checked={!formData[day].is_open}
            onCheckedChange={(checked) => {
              setFormData(prev => ({ 
                ...prev, 
                [day]: { ...prev[day], is_open: !checked }
              }));
            }}
          />
          <Label className="text-sm cursor-pointer">Closed</Label>
        </div>
      </div>
    </div>
  );

  const formIsValid = validateHours(formData);

  return (
    <>
      {isEditing ? (
        <div className="w-full max-w-2xl mx-auto p-4">
          <div>
            {Object.keys(dayLabels).map((day) => renderDayRow(day))}
          </div>
          <Button className="mt-6 w-full" onClick={handleSubmit} disabled={!formIsValid}>
            Submit
          </Button>
          {!formIsValid && (
            <p className="text-xs text-red-500 mt-2">
              All open days need both an open and closing time, or mark them closed.
            </p>
          )}
        </div>
      ) : (
        <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg">
          <h3 className="font-semibold mb-4">Hours of Operation</h3>
          <div className="space-y-2">
            {formattedHours && <p className="text-normal whitespace-pre-line">{formattedHours}</p>}
            <Button className="mt-6 w-full" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default HoursOfOperation; 