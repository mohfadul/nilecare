/**
 * Claim Service
 * Business logic for insurance claims processing
 */

import { v4 as uuidv4 } from 'uuid';
import { ClaimEntity, ClaimStatus } from '../entities/claim.entity';
import ClaimRepository from '../repositories/claim.repository';
import InvoiceRepository from '../repositories/invoice.repository';
import { logBillingAction } from '../middleware/audit-logger.middleware';
import { CreateClaimDto } from '../dtos/create-claim.dto';
import { logger } from '../config/logger.config';

export class ClaimService {
  private claimRepository: ClaimRepository;
  private invoiceRepository: InvoiceRepository;

  constructor() {
    this.claimRepository = new ClaimRepository();
    this.invoiceRepository = new InvoiceRepository();
  }

  /**
   * Create insurance claim
   */
  async createClaim(createDto: CreateClaimDto, userId: string): Promise<any> {
    try {
      // Generate claim number
      const claimNumber = await this.claimRepository.generateClaimNumber();

      // Calculate total charges
      const totalCharges = createDto.lineItems.reduce(
        (sum, item) => sum + item.chargeAmount,
        0
      );

      // Create claim entity
      const claim = new ClaimEntity({
        id: uuidv4(),
        claimNumber,
        invoiceId: createDto.invoiceId,
        patientId: createDto.patientId,
        facilityId: createDto.facilityId,
        encounterId: createDto.encounterId,
        insurancePolicyId: createDto.insurancePolicyId,
        billingAccountId: createDto.billingAccountId,
        claimType: createDto.claimType,
        claimFormat: createDto.claimFormat,
        status: ClaimStatus.DRAFT,
        serviceDateFrom: new Date(createDto.serviceDateFrom),
        serviceDateTo: new Date(createDto.serviceDateTo),
        totalCharges,
        renderingProviderId: createDto.renderingProviderId,
        billingProviderId: createDto.billingProviderId,
        referringProviderId: createDto.referringProviderId,
        payerId: createDto.payerId,
        claimNotes: createDto.claimNotes,
        attachments: createDto.attachments,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await this.claimRepository.create(claim);

      // Link to invoice if provided
      if (createDto.invoiceId) {
        const invoice = await this.invoiceRepository.findById(createDto.invoiceId);
        if (invoice) {
          invoice.insuranceClaimNumber = claimNumber;
          invoice.updatedBy = userId;
          await this.invoiceRepository.update(invoice);
        }
      }

      // Audit log
      await logBillingAction({
        action: 'claim_created',
        resourceType: 'claim',
        resourceId: claim.id,
        userId,
        result: 'success',
        newValues: {
          claimNumber,
          patientId: claim.patientId,
          totalCharges: claim.totalCharges
        }
      });

      logger.info('Claim created', {
        claimId: claim.id,
        claimNumber,
        patientId: claim.patientId,
        userId
      });

      return claim;

    } catch (error: any) {
      logger.error('Failed to create claim', {
        error: error.message,
        userId
      });
      throw new Error(`Failed to create claim: ${error.message}`);
    }
  }

  /**
   * Submit claim to insurance
   */
  async submitClaim(claimId: string, userId: string): Promise<any> {
    try {
      const claim = await this.claimRepository.findById(claimId);
      
      if (!claim) {
        throw new Error('Claim not found');
      }

      if (!claim.canBeSubmitted()) {
        throw new Error(`Cannot submit claim in status: ${claim.status}`);
      }

      const oldStatus = claim.status;
      claim.submit(userId);

      await this.claimRepository.update(claim);

      // In production: Send to clearinghouse/payer
      // await this.clearinghouseService.submitClaim(claim);

      // Audit log
      await logBillingAction({
        action: 'claim_submitted',
        resourceType: 'claim',
        resourceId: claim.id,
        userId,
        result: 'success',
        oldValues: { status: oldStatus },
        newValues: { status: claim.status, submissionDate: claim.submissionDate },
        changesSummary: 'Claim submitted to insurance'
      });

      logger.info('Claim submitted', {
        claimId,
        claimNumber: claim.claimNumber,
        userId
      });

      return claim;

    } catch (error: any) {
      logger.error('Failed to submit claim', {
        claimId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Process claim payment (when insurance pays)
   */
  async processClaimPayment(
    claimId: string,
    paidAmount: number,
    allowedAmount: number,
    userId: string,
    remittanceInfo?: any
  ): Promise<any> {
    try {
      const claim = await this.claimRepository.findById(claimId);
      
      if (!claim) {
        throw new Error('Claim not found');
      }

      const oldStatus = claim.status;
      claim.markAsPaid(paidAmount, new Date());
      claim.allowedAmount = allowedAmount;
      
      if (remittanceInfo) {
        claim.remittanceAdviceNumber = remittanceInfo.adviceNumber;
        claim.checkNumber = remittanceInfo.checkNumber;
        claim.checkDate = remittanceInfo.checkDate;
      }

      claim.updatedBy = userId;

      await this.claimRepository.update(claim);

      // Update linked invoice
      if (claim.invoiceId) {
        await this.applyClaimPaymentToInvoice(claim.invoiceId, paidAmount, userId);
      }

      // Audit log
      await logBillingAction({
        action: 'claim_payment_processed',
        resourceType: 'claim',
        resourceId: claim.id,
        userId,
        result: 'success',
        oldValues: { status: oldStatus },
        newValues: { status: claim.status, paidAmount: claim.paidAmount },
        changesSummary: `Insurance paid ${paidAmount}`,
        metadata: remittanceInfo
      });

      logger.info('Claim payment processed', {
        claimId,
        paidAmount,
        userId
      });

      return claim;

    } catch (error: any) {
      logger.error('Failed to process claim payment', {
        claimId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Deny claim
   */
  async denyClaim(
    claimId: string,
    denialReasonCode: string,
    denialReason: string,
    userId: string
  ): Promise<any> {
    try {
      const claim = await this.claimRepository.findById(claimId);
      
      if (!claim) {
        throw new Error('Claim not found');
      }

      const oldStatus = claim.status;
      claim.deny(denialReasonCode, denialReason);
      claim.updatedBy = userId;

      await this.claimRepository.update(claim);

      // Audit log
      await logBillingAction({
        action: 'claim_denied',
        resourceType: 'claim',
        resourceId: claim.id,
        userId,
        result: 'success',
        oldValues: { status: oldStatus },
        newValues: { status: claim.status, denialReason },
        changesSummary: `Claim denied: ${denialReason}`
      });

      logger.info('Claim denied', {
        claimId,
        denialReasonCode,
        userId
      });

      return claim;

    } catch (error: any) {
      logger.error('Failed to deny claim', {
        claimId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * File appeal for denied claim
   */
  async fileAppeal(claimId: string, appealNotes: string, userId: string): Promise<any> {
    try {
      const claim = await this.claimRepository.findById(claimId);
      
      if (!claim) {
        throw new Error('Claim not found');
      }

      if (!claim.canBeAppealed()) {
        throw new Error('Claim cannot be appealed (either not denied or past deadline)');
      }

      const oldStatus = claim.status;
      claim.fileAppeal();
      claim.claimNotes = (claim.claimNotes || '') + `\n[APPEAL ${claim.appealCount}] ${appealNotes}`;
      claim.updatedBy = userId;

      await this.claimRepository.update(claim);

      // Audit log
      await logBillingAction({
        action: 'claim_appeal_filed',
        resourceType: 'claim',
        resourceId: claim.id,
        userId,
        result: 'success',
        oldValues: { status: oldStatus, appealCount: claim.appealCount - 1 },
        newValues: { status: claim.status, appealCount: claim.appealCount },
        changesSummary: `Appeal #${claim.appealCount} filed`
      });

      logger.info('Claim appeal filed', {
        claimId,
        appealCount: claim.appealCount,
        userId
      });

      return claim;

    } catch (error: any) {
      logger.error('Failed to file appeal', {
        claimId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get claim by ID
   */
  async getClaimById(claimId: string): Promise<any> {
    return await this.claimRepository.findById(claimId);
  }

  /**
   * List claims by status
   */
  async listClaimsByStatus(status: ClaimStatus): Promise<ClaimEntity[]> {
    return await this.claimRepository.findByStatus(status);
  }

  /**
   * Apply claim payment to linked invoice
   */
  private async applyClaimPaymentToInvoice(
    invoiceId: string,
    amount: number,
    userId: string
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    
    if (invoice) {
      invoice.applyPartialPayment(amount, new Date());
      invoice.updatedBy = userId;
      await this.invoiceRepository.update(invoice);
    }
  }
}

export default ClaimService;

