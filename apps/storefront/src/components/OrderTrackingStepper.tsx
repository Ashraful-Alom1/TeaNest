import React from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  FileCheck,
  Home,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Order } from '@tea-nest/types';
import { formatDate } from '@tea-nest/shared';

interface OrderTrackingStepperProps {
  order: Order;
  compact?: boolean;
}

interface StepInfo {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  timestamp?: string;
}

export const OrderTrackingStepper: React.FC<OrderTrackingStepperProps> = ({
  order,
  compact = false,
}) => {
  if (order.status === 'CANCELLED') {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <p className="font-bold text-sm">Order Cancelled</p>
          <p className="text-xs text-rose-700">
            This order inquiry was cancelled. Any reserved stock has been released.
          </p>
        </div>
      </div>
    );
  }

  // Step indices:
  // 0: WHATSAPP_PENDING (Order Inquiry Submitted)
  // 1: CONFIRMED (Confirmed by Admin)
  // 2: PROCESSING (Garden Packing)
  // 3: SHIPPED (Out for Delivery / In Transit)
  // 4: DELIVERED (Delivered)
  let activeStepIndex = 0;
  switch (order.status) {
    case 'WHATSAPP_PENDING':
    case 'PENDING_CONFIRMATION':
    case 'DRAFT':
      activeStepIndex = 0;
      break;
    case 'CONFIRMED':
      activeStepIndex = 1;
      break;
    case 'PROCESSING':
      activeStepIndex = 2;
      break;
    case 'SHIPPED':
      activeStepIndex = 3;
      break;
    case 'DELIVERED':
      activeStepIndex = 4;
      break;
    default:
      activeStepIndex = 0;
  }

  const steps: StepInfo[] = [
    {
      key: 'inquiry',
      title: 'Order Placed',
      subtitle: 'Wait for Confirmation',
      icon: <Clock className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      timestamp: order.createdAt,
    },
    {
      key: 'confirmed',
      title: 'Order Confirmed',
      subtitle: 'Verified & Invoiced by Admin',
      icon: <FileCheck className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      timestamp: order.confirmedAt,
    },
    {
      key: 'packing',
      title: 'Garden Packing',
      subtitle: 'Sealed at Naharkatia Estate',
      icon: <Package className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      timestamp: order.processingAt,
    },
    {
      key: 'shipped',
      title: 'Out for Delivery',
      subtitle: order.courierName ? `${order.courierName} In Transit` : 'Dispatched with Courier',
      icon: <Truck className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      timestamp: order.shippedAt,
    },
    {
      key: 'delivered',
      title: 'Delivered',
      subtitle: 'Received at Destination',
      icon: <Home className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      timestamp: order.deliveredAt,
    },
  ];

  // Calculate line completion percentage (0% to 100%)
  const progressPercentage = (activeStepIndex / (steps.length - 1)) * 100;

  if (compact) {
    return (
      <div className="w-full py-2">
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-cream-200 -translate-y-1/2 z-0 rounded-full" />
          
          {/* Filled Green Line */}
          <div
            className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Stepper Circles */}
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-[10px] ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100'
                      : isCurrent
                      ? 'bg-emerald-700 text-white shadow-md ring-4 ring-emerald-200 animate-pulse'
                      : 'bg-white text-charcoal-400 border-2 border-cream-300'
                  }`}
                  title={`${step.title} - ${step.subtitle}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold whitespace-nowrap hidden sm:block ${
                    isCurrent
                      ? 'text-emerald-800 font-bold'
                      : isCompleted
                      ? 'text-forest-900'
                      : 'text-charcoal-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-cream-50/50 rounded-2xl p-5 sm:p-7 border border-cream-300">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 mb-6 border-b border-cream-200">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-forest-700 uppercase">
            Order Status Tracking
          </span>
          <h4 className="font-serif text-lg font-bold text-charcoal-950 mt-0.5">
            {steps[activeStepIndex].title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>Step {activeStepIndex + 1} of 5 Completed / Active</span>
          </span>
        </div>
      </div>

      {/* Horizontal Line-and-Circle Stepper Track */}
      <div className="relative my-6 px-2 sm:px-6">
        {/* Continuous Background Line */}
        <div className="absolute top-5 left-4 right-4 sm:left-10 sm:right-10 h-1.5 bg-cream-200 -translate-y-1/2 z-0 rounded-full" />

        {/* Dynamic Vibrant Green Progress Line */}
        <div
          className="absolute top-5 left-4 sm:left-10 h-1.5 bg-emerald-600 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-in-out"
          style={{
            width: `calc(${progressPercentage}% - ${
              progressPercentage === 100 ? '0px' : '10px'
            })`,
          }}
        />

        {/* Stepper Nodes */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center max-w-[80px] sm:max-w-[130px]"
              >
                {/* Milestone Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : isCurrent
                      ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-110 shadow-lg shadow-emerald-700/20 animate-pulse'
                      : 'bg-white text-charcoal-400 border-2 border-cream-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step Title & Timestamp */}
                <div className="mt-3 space-y-0.5">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-emerald-800'
                        : isCompleted
                        ? 'text-charcoal-900'
                        : 'text-charcoal-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-charcoal-500 hidden sm:block leading-tight">
                    {step.subtitle}
                  </p>
                  {step.timestamp && (
                    <p className="text-[9px] font-semibold text-forest-700 mt-1">
                      {formatDate(step.timestamp)}
                    </p>
                  )}
                  {isCurrent && !step.timestamp && (
                    <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded mt-1">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courier Tracking Details (if Shipped or Delivered) */}
      {order.trackingNumber && (
        <div className="mt-8 p-4 bg-white rounded-xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-charcoal-500 font-medium">
                Courier Tracking / AWB Number:
              </p>
              <p className="text-sm font-bold text-charcoal-900">
                {order.courierName || 'Logistics'}: <span className="text-emerald-700 font-mono">{order.trackingNumber}</span>
              </p>
            </div>
          </div>

          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
            >
              <span>Track with {order.courierName || 'Courier'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
