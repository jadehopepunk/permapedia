module ApplicationHelper
  def html_join(*parts)
    parts.non_blank.join(' ').html_safe
  end  
end
