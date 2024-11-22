import * as React from "react";
import * as Select from "@radix-ui/react-select";

export default function TimePicker({
  time,
  setTime,
}: {
  time: string;
  setTime: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [hour, setHour] = React.useState("12");
  const [minute, setMinute] = React.useState("00");
  const [period, setPeriod] = React.useState("AM");

  // Update the parent state when any part of the time changes
  React.useEffect(() => {
    setTime(`${hour}:${minute} ${period}`);
  }, [hour, minute, period]);

  // Generate hours and minutes for dropdown options
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className="flex gap-2">
      {/* Hour Picker */}
      <Select.Root value={hour} onValueChange={setHour}>
        <Select.Trigger
          className="inline-flex items-center justify-between border p-2 rounded-md w-[4rem] bg-white"
        >
          <Select.Value />
          <div className="h-4 w-4 text-gray-500 bg-gray-300" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white border rounded-md shadow-lg">
            <Select.ScrollUpButton className="flex items-center justify-center p-2">
              <div className="h-4 w-4 text-gray-500" />
            </Select.ScrollUpButton>
            <Select.Viewport>
              {hours.map((h) => (
                <Select.Item
                  key={h}
                  value={h}
                  className="p-2 hover:bg-gray-100 text-center"
                >
                  {h}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Minute Picker */}
      <Select.Root value={minute} onValueChange={setMinute}>
        <Select.Trigger
          className="inline-flex items-center justify-between border p-2 rounded-md w-[4rem] bg-white"
        >
          <Select.Value />
          <div className="h-4 w-4 text-gray-500" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white border rounded-md shadow-lg">
            <Select.ScrollUpButton className="flex items-center justify-center p-2">
              <div className="h-4 w-4 text-gray-500" />
            </Select.ScrollUpButton>
            <Select.Viewport>
              {minutes.map((m) => (
                <Select.Item
                  key={m}
                  value={m}
                  className="p-2 hover:bg-gray-100 text-center"
                >
                  {m}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* AM/PM Selector */}
      <Select.Root value={period} onValueChange={setPeriod}>
        <Select.Trigger
          className="inline-flex items-center justify-between border p-2 rounded-md w-[4rem] bg-white"
        >
          <Select.Value />
          <div className="h-4 w-4 text-gray-500" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white border rounded-md shadow-lg">
            <Select.Viewport>
              <Select.Item
                value="AM"
                className="p-2 hover:bg-gray-100 text-center"
              >
                AM
              </Select.Item>
              <Select.Item
                value="PM"
                className="p-2 hover:bg-gray-100 text-center"
              >
                PM
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
