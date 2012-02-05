module NavigationHelper
  def render_breadcrumbs
    render_crumbs(
      :format => :html_list, 
      :ul_class => 'breadcrumb', 
      :active_li_class => 'active', 
      :separator => content_tag(:span, ' / ', :class => 'divider'), 
      :skip_if_blank => true).html_safe
  end

  def bootstrap_flash_message_type(type)
    case type
      when :alert
        "warning"
      when :error
        "error"
      when :notice
        "info"
      when :success
        "success"
      else
        type.to_s
    end
  end
  
  def controllers_array(*params)
    params.map do |param|
      {:controller => param}
    end
  end
end