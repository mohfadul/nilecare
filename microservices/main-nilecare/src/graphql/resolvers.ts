/**
 * GraphQL Resolvers
 * Phase 3: Maps GraphQL queries to REST API calls
 */

import axios from 'axios';

export interface GraphQLContext {
  req: any;
  proxyToService: Function;
  cache: any;
}

export const resolvers = {
  Query: {
    // ===== PATIENT QUERIES =====
    
    patient: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'clinical-service',
        `/api/v1/patients/${id}`,
        'GET',
        context.req
      );
      return data.data;
    },
    
    patients: async (_: any, { limit, offset }: { limit?: number; offset?: number }, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'clinical-service',
        `/api/v1/patients?limit=${limit || 20}&offset=${offset || 0}`,
        'GET',
        context.req
      );
      return {
        patients: data.data.patients || data.data,
        total: data.data.total || 0,
        page: data.data.page || 1,
        limit: data.data.limit || limit || 20
      };
    },
    
    // ===== APPOINTMENT QUERIES =====
    
    appointment: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'business-service',
        `/api/v1/appointments/${id}`,
        'GET',
        context.req
      );
      return data.data;
    },
    
    appointments: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.patientId) query += `patientId=${args.patientId}&`;
      if (args.date) query += `date=${args.date}&`;
      if (args.limit) query += `limit=${args.limit}`;
      
      const data = await context.proxyToService(
        'business-service',
        `/api/v1/appointments?${query}`,
        'GET',
        context.req
      );
      return data.data.appointments || data.data || [];
    },
    
    // ===== MEDICATION QUERIES =====
    
    medications: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.patientId) query += `patientId=${args.patientId}&`;
      if (args.status) query += `status=${args.status}`;
      
      const data = await context.proxyToService(
        'medication-service',
        `/api/v1/medications?${query}`,
        'GET',
        context.req
      );
      return data.data || [];
    },
    
    // ===== LAB ORDER QUERIES =====
    
    labOrders: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.patientId) query += `patientId=${args.patientId}&`;
      if (args.status) query += `status=${args.status}`;
      
      const data = await context.proxyToService(
        'lab-service',
        `/api/v1/lab-orders?${query}`,
        'GET',
        context.req
      );
      return data.data || [];
    },
    
    // ===== BILLING QUERIES =====
    
    invoice: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'billing-service',
        `/api/v1/billing/${id}`,
        'GET',
        context.req
      );
      return data.data;
    },
    
    invoices: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.patientId) query += `patientId=${args.patientId}&`;
      if (args.status) query += `status=${args.status}`;
      
      const data = await context.proxyToService(
        'billing-service',
        `/api/v1/billing?${query}`,
        'GET',
        context.req
      );
      return data.data || [];
    },
    
    // ===== PAYMENT QUERIES =====
    
    payment: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const data = await context.cachedProxyToService(
        'payment-service',
        `/api/v1/payments/${id}`,
        'GET',
        context.req,
        { ttl: 180, keyPrefix: 'payments' }
      );
      return data.data;
    },
    
    payments: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.patientId) query += `patientId=${args.patientId}&`;
      if (args.facilityId) query += `facilityId=${args.facilityId}&`;
      if (args.status) query += `status=${args.status}`;
      
      const data = await context.cachedProxyToService(
        'payment-service',
        `/api/v1/payments?${query}`,
        'GET',
        context.req,
        { ttl: 120, keyPrefix: 'payments:list' }
      );
      return data.data || [];
    },
    
    paymentStats: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.facilityId) query += `facilityId=${args.facilityId}&`;
      if (args.startDate) query += `startDate=${args.startDate}&`;
      if (args.endDate) query += `endDate=${args.endDate}`;
      
      const data = await context.cachedProxyToService(
        'payment-service',
        `/api/v1/payments/stats?${query}`,
        'GET',
        context.req,
        { ttl: 300, keyPrefix: 'payments:stats' }
      );
      return data.data;
    },
    
    pendingVerifications: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.facilityId) query += `facilityId=${args.facilityId}`;
      
      const data = await context.proxyToService(
        'payment-service',
        `/api/v1/payments/pending-verification?${query}`,
        'GET',
        context.req
      );
      return data.data || [];
    },
    
    // ===== REFUND QUERIES =====
    
    refund: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const data = await context.cachedProxyToService(
        'payment-service',
        `/api/v1/refunds/${id}`,
        'GET',
        context.req,
        { ttl: 300, keyPrefix: 'refunds' }
      );
      return data.data;
    },
    
    refunds: async (_: any, args: any, context: GraphQLContext) => {
      let query = '';
      if (args.paymentId) query += `paymentId=${args.paymentId}`;
      
      const data = await context.proxyToService(
        'payment-service',
        `/api/v1/refunds?${query}`,
        'GET',
        context.req
      );
      return data.data || [];
    }
  },
  
  Mutation: {
    // ===== PATIENT MUTATIONS =====
    
    createPatient: async (_: any, { input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'clinical-service',
        '/api/v1/patients',
        'POST',
        { ...context.req, body: input }
      );
      
      // Invalidate cache
      await context.cache.invalidatePattern('clinical-service:/api/v1/patients:*');
      
      return data.data;
    },
    
    updatePatient: async (_: any, { id, input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'clinical-service',
        `/api/v1/patients/${id}`,
        'PUT',
        { ...context.req, body: input }
      );
      
      // Invalidate cache
      await context.cache.del(`clinical-service:/api/v1/patients/${id}:`);
      await context.cache.invalidatePattern('clinical-service:/api/v1/patients:*');
      
      return data.data;
    },
    
    deletePatient: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      await context.proxyToService(
        'clinical-service',
        `/api/v1/patients/${id}`,
        'DELETE',
        context.req
      );
      
      // Invalidate cache
      await context.cache.del(`clinical-service:/api/v1/patients/${id}:`);
      await context.cache.invalidatePattern('clinical-service:/api/v1/patients:*');
      
      return { success: true, message: 'Patient deleted successfully' };
    },
    
    // ===== APPOINTMENT MUTATIONS =====
    
    createAppointment: async (_: any, { input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'business-service',
        '/api/v1/appointments',
        'POST',
        { ...context.req, body: input }
      );
      
      // Invalidate cache
      await context.cache.invalidatePattern('business-service:/api/v1/appointments:*');
      
      return data.data;
    },
    
    updateAppointment: async (_: any, { id, input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'business-service',
        `/api/v1/appointments/${id}`,
        'PUT',
        { ...context.req, body: input }
      );
      
      // Invalidate cache
      await context.cache.invalidatePattern('business-service:/api/v1/appointments:*');
      
      return data.data;
    },
    
    cancelAppointment: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'business-service',
        `/api/v1/appointments/${id}`,
        'DELETE',
        context.req
      );
      
      // Invalidate cache
      await context.cache.invalidatePattern('business-service:/api/v1/appointments:*');
      
      return data.data;
    },
    
    // ===== PAYMENT MUTATIONS =====
    
    initiatePayment: async (_: any, { input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'payment-service',
        '/api/v1/payments/initiate',
        'POST',
        { ...context.req, body: input }
      );
      
      // Invalidate caches
      await context.cache.invalidatePattern('payment-service:*');
      await context.cache.invalidatePattern('billing-service:*');
      
      return data.data;
    },
    
    verifyPayment: async (_: any, { input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'payment-service',
        '/api/v1/payments/verify',
        'POST',
        { ...context.req, body: input }
      );
      
      // Invalidate payment caches
      await context.cache.invalidatePattern('payment-service:*');
      
      return data.data;
    },
    
    cancelPayment: async (_: any, { id, reason }: { id: string; reason: string }, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'payment-service',
        `/api/v1/payments/${id}/cancel`,
        'PATCH',
        { ...context.req, body: { reason } }
      );
      
      // Invalidate caches
      await context.cache.invalidatePattern('payment-service:*');
      await context.cache.invalidatePattern('billing-service:*');
      
      return data.data;
    },
    
    // ===== REFUND MUTATIONS =====
    
    requestRefund: async (_: any, { input }: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'payment-service',
        '/api/v1/refunds',
        'POST',
        { ...context.req, body: input }
      );
      
      // Invalidate caches
      await context.cache.invalidatePattern('payment-service:*');
      await context.cache.invalidatePattern('billing-service:*');
      
      return data.data;
    }
  },
  
  // ===== FIELD RESOLVERS =====
  
  Patient: {
    // Nested data - fetch appointments for a patient
    appointments: async (parent: any, _: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'business-service',
        `/api/v1/appointments?patientId=${parent.id}`,
        'GET',
        context.req
      );
      return data.data.appointments || data.data || [];
    },
    
    // Nested data - fetch medications for a patient
    medications: async (parent: any, _: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'medication-service',
        `/api/v1/medications?patientId=${parent.id}`,
        'GET',
        context.req
      );
      return data.data || [];
    },
    
    // Nested data - fetch lab orders for a patient
    labOrders: async (parent: any, _: any, context: GraphQLContext) => {
      const data = await context.proxyToService(
        'lab-service',
        `/api/v1/lab-orders?patientId=${parent.id}`,
        'GET',
        context.req
      );
      return data.data || [];
    }
  }
};

export default resolvers;

