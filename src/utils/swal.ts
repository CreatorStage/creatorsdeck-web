import Swal, { SweetAlertIcon } from 'sweetalert2';

// Mixin for standard modal alerts with custom class overrides to match the YT-PLATAFORM theme
export const customSwal = Swal.mixin({
  background: '#1c1c1c',
  color: '#f1f1f1',
  buttonsStyling: false, // Disables standard styles to allow full Tailwind utility overrides
  customClass: {
    popup: 'rounded-lg border border-[#404040] font-sans shadow-2xl p-6',
    title: 'text-lg font-bold font-sans text-[#f1f1f1] mb-2',
    htmlContainer: 'text-sm text-[#aaaaaa] font-sans mb-4',
    confirmButton: 'px-5 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider bg-[#ff5045] text-black hover:bg-[#ff3f33] transition duration-150 focus:outline-none cursor-pointer inline-flex items-center justify-center min-h-[36px]',
    cancelButton: 'px-5 py-2.5 rounded text-xs uppercase font-semibold tracking-wider border border-[#404040] text-[#f1f1f1] hover:bg-white/5 transition duration-150 focus:outline-none ml-3 cursor-pointer inline-flex items-center justify-center min-h-[36px]',
    actions: 'mt-4 flex justify-end w-full',
  },
});

// Toast mixin for fast, micro-animated notifications
export const toastSwal = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1c1c1c',
  color: '#f1f1f1',
  customClass: {
    popup: 'rounded border border-[#404040] font-sans shadow-lg p-3',
    title: 'text-sm font-semibold font-sans text-[#f1f1f1]',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const swal = {
  /**
   * Shows a standard dialog
   */
  alert(title: string, text = '', icon: SweetAlertIcon = 'info') {
    return customSwal.fire({
      title,
      text,
      icon,
    });
  },

  /**
   * Shows a success dialog
   */
  success(title: string, text = '') {
    return customSwal.fire({
      title,
      text,
      icon: 'success',
    });
  },

  /**
   * Shows an error dialog
   */
  error(title: string, text = '') {
    return customSwal.fire({
      title,
      text,
      icon: 'error',
    });
  },

  /**
   * Shows a confirmation dialog, returning a boolean promise
   */
  async confirm(title: string, text = '', confirmButtonText = 'Confirmar', cancelButtonText = 'Cancelar'): Promise<boolean> {
    const result = await customSwal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true, // Cancel on left, Confirm on right
    });
    return !!result.isConfirmed;
  },

  /**
   * Shows a rapid, micro-animated toast notification
   */
  toast(title: string, icon: SweetAlertIcon = 'success') {
    return toastSwal.fire({
      title,
      icon,
    });
  }
};
