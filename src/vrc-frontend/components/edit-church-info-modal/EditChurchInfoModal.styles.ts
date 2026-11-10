// The form itself moved to the shared ChurchInfoForm (also used by
// the AdminPortal Church Info tab). Only the modal's own header icon
// style remains here.
export const editChurchInfoModalStyles = {
  headerIcon: "w-5 h-5 text-amber-400",
  // Scrollable body inside the Modal (the shared Modal body has no
  // padding, so this wrapper supplies it).
  body: "flex-1 overflow-y-auto p-5",
};
