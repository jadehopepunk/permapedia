module FormHelper
  def form_errors(f)
    if f.error_notification
      content_tag(:div, :class => 'alert-message error fade in', :'data-alert' => 'alert') do
        link_to(' x ', '#', :class => 'close') +
        content_tag(:p, f.error_notification)
      end
    end
  end
  
  def form_actions(f, cancel_link = {:action => :index})
    content_tag(:div, :class => 'form-actions') do
      [
        f.button(:submit, :class => 'btn-primary'),
        button_tag('Cancel', :onclick => "document.location = #{url_for(cancel_link).to_json}; return false;", :class => "btn")
      ].join(' ').html_safe
    end
  end
end