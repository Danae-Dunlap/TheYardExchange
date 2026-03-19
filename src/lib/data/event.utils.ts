import { supabase } from "@/integrations/supabase/client";
import type { BusinessEvent } from "../interfaces";

/**
 * Fetches a businesses' event from the database.
 *
 * @param business_id used to find events
 * @returns a list of events tied to the business
 */
export async function fetchEvents(
  business_id: string
): Promise<BusinessEvent[] | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("business_id", business_id);
  if (error) {
    throw new Error(`Error fetching events: ${error.message}`);
  }

  const events = data.map((event: any) => {
    return {
      id: event.id,
      business_id: event.business_id,
      business_name: event.business_name,
      title: event.title,
      description: event.description,
      start_date: new Date(event.start_date),
      end_date: new Date(event.end_date),
    };
  });

  return events;
}

/**
 * Inserts a new event into the database.
 *
 * @param event event data
 * @throws Error if the insert operation fails.
 */
export async function insertEvent(event: BusinessEvent): Promise<void> {
  const { error } = await supabase.from("events").insert({
    id: event.id,
    business_id: event.business_id,
    business_name: event.business_name,
    title: event.title,
    description: event.description || null,
    start_date: event.start_date.toISOString(),
    end_date: event.end_date.toISOString(),
  });
  if (error) {
    throw new Error(`Error inserting event: ${error.message}`);
  }
}

/**
 * Updates an existing event in the database.
 *
 * @param event event data
 * @throws Error if the update operation fails.
 */
export async function updateEvent(event: BusinessEvent): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({
      title: event.title,
      description: event.description || null,
      start_date: event.start_date.toISOString(),
      end_date: event.end_date.toISOString(),
    })
    .eq("id", event.id);
  if (error) {
    throw new Error(`Error updating event: ${error.message}`);
  }
}

/**
 * Deletes an event from the database.
 *
 * @param eventId
 * @throws Error if the delete operation fails.
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    throw new Error(`Error deleting event: ${error.message}`);
  }
}
