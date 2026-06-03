import { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";

import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointments,
  updateAppointment,
} from "../services/appointment/appointment.service";

import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from "../services/appointment/appointment.schema";

import {
  listAvailableSlots,
} from "../services/appointment/availability.service";

function handleServiceError(
  error: unknown
) {

  if (
    error instanceof Error &&
    error.message ===
      "APPOINTMENT_NOT_FOUND"
  ) {

    return {
      statusCode: 404,
      body: {
        error:
          "Agendamento não encontrado",
      },
    };
  }

  if (
    error instanceof Error &&
    error.message === "CLIENT_NOT_FOUND"
  ) {

    return {
      statusCode: 404,
      body: {
        error: "Cliente não encontrado",
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        error: "Dados inválidos",
        details: error.flatten(),
      },
    };
  }

  throw error;
}

export async function appointmentRoutes(
  app: FastifyInstance
) {

  app.get("/appointments", async (
    request,
    reply
  ) => {

    try {

      const query =
        listAppointmentsQuerySchema.parse(
          request.query
        );

      return await listAppointments(
        query
      );

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.get("/appointments/availability", async (
    request,
    reply
  ) => {

    try {

      const querySchema = z.object({
        fromDate: z
          .string()
          .optional(),

        days: z.coerce
          .number()
          .int()
          .min(1)
          .max(30)
          .optional(),

        durationMin: z.coerce
          .number()
          .int()
          .min(15)
          .max(480)
          .optional(),
      });

      const query =
        querySchema.parse(
          request.query
        );

      return await listAvailableSlots(
        query
      );

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.get("/appointments/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        appointmentIdParamSchema.parse(
          request.params
        );

      return await getAppointment(id);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.post("/appointments", async (
    request,
    reply
  ) => {

    try {

      const body =
        createAppointmentSchema.parse(
          request.body
        );

      return reply
        .status(201)
        .send(
          await createAppointment(body)
        );

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.put("/appointments/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        appointmentIdParamSchema.parse(
          request.params
        );

      const body =
        updateAppointmentSchema.parse(
          request.body
        );

      return await updateAppointment(
        id,
        body
      );

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.delete("/appointments/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        appointmentIdParamSchema.parse(
          request.params
        );

      return await deleteAppointment(id);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });
}
